import type {
  ProjectConfig,
  ProjectObservation,
  SyncProjectResult,
  SyncResult,
} from '@harbr/domain'
import { Effect, Result } from 'effect'

import type { ProjectServiceApi, ProjectServiceError } from '@harbr/db'
import type { ProjectObservationResult, ScannerServiceApi } from '@harbr/scanner'

import { stabilizeRuntimeFacts } from './reconciler.runtimes'

export function syncProjects(
  projects: readonly ProjectConfig[],
  scanner: ScannerServiceApi,
  projectService: ProjectServiceApi,
) {
  return Effect.gen(function* () {
    const observations = yield* scanner.observeProjects(projects).pipe(
      Effect.catch((error) =>
        Effect.succeed<readonly ProjectObservationResult[]>(
          projects.map((project) => ({
            project,
            result: Result.fail(error),
          })),
        ),
      ),
    )
    const runtimeObservation = observations.flatMap((observation) =>
      Result.isSuccess(observation.result) ? [observation.result.success] : [],
    )[0]
    const reconciledObservations = runtimeObservation
      ? yield* reconcileRuntimeFacts(observations, projectService, runtimeObservation.runtimeSource)
      : observations

    const results = yield* Effect.forEach(reconciledObservations, ({ project, result }) =>
      Result.isFailure(result)
        ? Effect.succeed<SyncProjectResult>(projectErrorResult(project, result.failure))
        : persistObservation(projectService, result.success),
    )

    if (runtimeObservation && runtimeObservation.runtimeIssue === null) {
      yield* projectService.pruneRuntimeBindings(
        runtimeObservation.runtimeSource,
        runtimeObservation.observedRuntimes.map((runtime) => runtime.identity.externalId),
      )
    }

    return { projects: results } satisfies SyncResult
  })
}

export function refreshConfiguredProject(
  scanner: ScannerServiceApi,
  projectService: ProjectServiceApi,
  project: ProjectConfig,
) {
  return Effect.gen(function* () {
    const observation = yield* scanner.observeProject(project)
    const reconciled = yield* reconcileRuntimeFacts(
      [{ project, result: Result.succeed(observation) }],
      projectService,
      observation.runtimeSource,
    )
    const reconciledResult = reconciled[0]!.result
    const reconciledObservation = Result.isSuccess(reconciledResult)
      ? reconciledResult.success
      : observation
    const result = yield* persistObservation(projectService, reconciledObservation)

    if (observation.runtimeIssue === null) {
      yield* projectService.pruneRuntimeBindings(
        observation.runtimeSource,
        observation.observedRuntimes.map((runtime) => runtime.identity.externalId),
      )
    }

    return result
  })
}

function reconcileRuntimeFacts(
  observations: readonly ProjectObservationResult[],
  projectService: ProjectServiceApi,
  source: ProjectObservation['runtimeSource'],
) {
  return Effect.map(projectService.listActiveRuntimeSummaries(source), (existing) =>
    stabilizeRuntimeFacts(observations, existing),
  )
}

function persistObservation(
  projectService: ProjectServiceApi,
  observation: ProjectObservation,
): Effect.Effect<SyncProjectResult, ProjectServiceError> {
  return Effect.gen(function* () {
    yield* projectService.syncSnapshot({
      projectIssue: observation.projectIssue ?? null,
      projectName: observation.projectName,
      repoPath: observation.repoPath,
      repoKind: observation.repoKind,
      workspaces: observation.workspaces,
      runtimes: observation.runtimes,
      runtimeIssue: observation.runtimeIssue,
      runtimeSource: observation.runtimeSource,
    })

    return {
      projectName: observation.projectName,
      repoPath: observation.repoPath,
      repoKind: observation.repoKind,
      workspaceCount: observation.workspaces.length,
      moduleCount: observation.workspaces.reduce(
        (count, workspace) => count + workspace.modules.length,
        0,
      ),
      runtimeCount: observation.runtimes.length,
      status: observation.workspaces.length > 0 ? 'synced' : 'no_workspace',
      errorTag: null,
      runtimeIssue: observation.runtimeIssue,
    } satisfies SyncProjectResult
  })
}

function projectErrorResult(project: ProjectConfig, error: unknown): SyncProjectResult {
  return {
    projectName: project.name,
    repoPath: project.repo,
    repoKind: null,
    workspaceCount: 0,
    moduleCount: 0,
    runtimeCount: 0,
    status: 'error',
    errorTag: getErrorTag(error),
    runtimeIssue: null,
  } satisfies SyncProjectResult
}

function getErrorTag(error: unknown) {
  if (error instanceof Error && '_tag' in error) {
    return String(error._tag)
  }

  if (error instanceof Error) {
    return error.name
  }

  return 'UnknownError'
}
