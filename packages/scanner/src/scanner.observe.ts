import type { ProjectConfig, ProjectObservation } from '@harbr/domain'
import type { GitServiceApi } from '@harbr/git'
import type {
  RuntimeDiscovery,
  RuntimeDiscoveryServiceApi,
} from '@harbr/runtime-tmux/discovery'
import { Effect } from 'effect'

import { scanProject } from './scanner.scan'
import type { ProjectObservationResult } from './services/scanner.service'

export function observeProjectsWithGit(
  git: GitServiceApi,
  runtimeDiscovery: RuntimeDiscoveryServiceApi,
  projects: readonly ProjectConfig[],
) {
  return runtimeDiscovery.listRuntimes.pipe(
    Effect.flatMap((discovery) =>
      Effect.forEach(projects, (project) =>
        observeProjectWithDiscovery(git, discovery, project).pipe(
          Effect.either,
          Effect.map(
            (result) =>
              ({
                project,
                result,
              }) satisfies ProjectObservationResult,
          ),
        ),
      ),
    ),
  )
}

export function observeProjectWithGit(
  git: GitServiceApi,
  runtimeDiscovery: RuntimeDiscoveryServiceApi,
  project: ProjectConfig,
) {
  return runtimeDiscovery.listRuntimes.pipe(
    Effect.flatMap((discovery) =>
      observeProjectWithDiscovery(git, discovery, project),
    ),
  )
}

function observeProjectWithDiscovery(
  git: GitServiceApi,
  discovery: RuntimeDiscovery,
  project: ProjectConfig,
) {
  return git.inspectRepo(project.repo).pipe(
    Effect.flatMap((repo) =>
      Effect.all({
        projectIssue: git.getDefaultBranchIssue(repo),
        workspaces: git.listWorkspaces(repo),
      }).pipe(
        Effect.flatMap(({ projectIssue, workspaces }) =>
          Effect.all(
            workspaces.map((workspace) =>
              scanProject(project, workspace.path).pipe(
                Effect.map((scan) => ({
                  branchName: workspace.branchName,
                  workspaceName: workspace.name,
                  workspacePath: scan.workspacePath,
                  kind: workspace.kind,
                  modules: scan.modules,
                })),
              ),
            ),
          ).pipe(
            Effect.map(
              (observedWorkspaces) =>
                ({
                  projectIssue,
                  projectName: project.name,
                  repoPath: repo.repoPath,
                  repoKind: repo.kind,
                  workspaces: observedWorkspaces,
                  runtimes: discovery.runtimes.filter((runtime) =>
                    matchesProjectObservation(
                      runtime,
                      project.name,
                      observedWorkspaces,
                    ),
                  ),
                  runtimeIssue: discovery.runtimeIssue,
                }) satisfies ProjectObservation,
            ),
          ),
        ),
      ),
    ),
  )
}

function matchesProjectObservation(
  runtime: ProjectObservation['runtimes'][number],
  projectName: string,
  workspaces: ProjectObservation['workspaces'],
) {
  if (runtime.projectName !== projectName) {
    return false
  }

  if (runtime.scope === 'project') {
    return true
  }

  const workspace = workspaces.find(
    (candidate) => candidate.workspaceName === runtime.workspaceName,
  )

  if (!workspace) {
    return false
  }

  return (
    runtime.scope !== 'module' ||
    workspace.modules.some((module) => module.name === runtime.moduleName)
  )
}
