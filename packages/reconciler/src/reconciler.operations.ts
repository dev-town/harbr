import type {
  ProjectConfig,
  ProjectObservation,
  SyncProjectResult,
  SyncResult,
} from '@harbr/domain'
import { Effect, Either } from 'effect'

import type { ProjectServiceApi, ProjectServiceError } from '@harbr/db'
import type {
  ProjectObservationResult,
  ScannerServiceApi,
} from '@harbr/scanner'

export function syncProjects(
  projects: readonly ProjectConfig[],
  scanner: ScannerServiceApi,
  projectService: ProjectServiceApi,
) {
  return Effect.gen(function* () {
    const observations = yield* scanner.observeProjects(projects).pipe(
      Effect.catchAll((error) =>
        Effect.succeed<readonly ProjectObservationResult[]>(
          projects.map((project) => ({
            project,
            result: Either.left(error),
          })),
        ),
      ),
    )

    const results = yield* Effect.forEach(
      observations,
      ({ project, result }) =>
        Either.isLeft(result)
          ? Effect.succeed<SyncProjectResult>(
              projectErrorResult(project, result.left),
            )
          : persistObservation(projectService, result.right),
    )

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

    return yield* persistObservation(projectService, observation)
  })
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

function projectErrorResult(
  project: ProjectConfig,
  error: unknown,
): SyncProjectResult {
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
