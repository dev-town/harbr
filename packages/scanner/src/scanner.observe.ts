import type { ProjectConfig, ProjectObservation } from '@harbr/domain'
import type { GitServiceApi } from '@harbr/git'
import type { RuntimeTmuxServiceApi } from '@harbr/runtime-tmux'
import { Effect } from 'effect'

import { scanProject } from './scanner.scan'

export function observeProjectWithGit(
  git: GitServiceApi,
  runtimeTmux: RuntimeTmuxServiceApi,
  project: ProjectConfig,
) {
  return git.inspectRepo(project.repo).pipe(
    Effect.flatMap((repo) =>
      Effect.all({
        projectIssue: git.getDefaultBranchIssue(repo),
        workspaces: git.listWorkspaces(repo),
      }).pipe(
        Effect.flatMap(({ projectIssue, workspaces }) =>
          runtimeTmux.listRuntimes.pipe(
            Effect.flatMap(({ runtimes, runtimeIssue }) =>
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
                Effect.map((observedWorkspaces) => ({
                  projectIssue,
                  projectName: project.name,
                  repoPath: repo.repoPath,
                  repoKind: repo.kind,
                  workspaces: observedWorkspaces,
                  runtimes: runtimes.filter((runtime) =>
                    matchesProjectObservation(runtime, project.name, observedWorkspaces),
                  ),
                  runtimeIssue,
                }) satisfies ProjectObservation),
              ),
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
