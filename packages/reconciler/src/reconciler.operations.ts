import type {
  ProjectConfig,
  SyncProjectResult,
  SyncResult,
} from '@harbr/domain'
import { Effect } from 'effect'

import type { ProjectServiceApi } from '@harbr/db'
import type { ScannerServiceApi } from '@harbr/scanner'

export function syncProjects(
  projects: readonly ProjectConfig[],
  scanner: ScannerServiceApi,
  projectService: ProjectServiceApi,
) {
  return Effect.gen(function* () {
    const results = yield* Effect.forEach(projects, (project) =>
      refreshConfiguredProject(scanner, projectService, project).pipe(
        Effect.catchAll((error) =>
          Effect.succeed<SyncProjectResult>({
            projectName: project.name,
            repoPath: project.repo,
            repoKind: null,
            workspaceCount: 0,
            moduleCount: 0,
            runtimeCount: 0,
            status: 'error',
            errorTag: getErrorTag(error),
            runtimeIssue: null,
          }),
        ),
      ),
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

function getErrorTag(error: unknown) {
  if (error instanceof Error && '_tag' in error) {
    return String(error._tag)
  }

  if (error instanceof Error) {
    return error.name
  }

  return 'UnknownError'
}
