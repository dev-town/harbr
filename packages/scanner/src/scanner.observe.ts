import type { ProjectConfig, ProjectObservation } from '@harbour/domain'
import type { GitServiceApi } from '@harbour/git'
import type { RuntimeTmuxServiceApi } from '@harbour/runtime-tmux'
import { Effect } from 'effect'
import path from 'node:path'

import { scanProject } from './scanner.scan'

export function observeProjectWithGit(
  git: GitServiceApi,
  runtimeTmux: RuntimeTmuxServiceApi,
  project: ProjectConfig,
) {
  return git.inspectRepo(project.repo).pipe(
    Effect.flatMap((repo) =>
      git.resolveWorkspacePath(repo).pipe(
        Effect.flatMap((workspacePath) =>
          runtimeTmux.listRuntimes.pipe(
            Effect.flatMap(({ runtimes, runtimeIssue }) =>
              workspacePath
                ? scanProject(project, workspacePath).pipe(
                    Effect.map((scan) => {
                      const workspaceName = getWorkspaceName(repo.kind, scan.workspacePath)

                      return {
                        projectName: project.name,
                        repoPath: scan.repoPath,
                        repoKind: repo.kind,
                        workspaceName,
                        workspacePath: scan.workspacePath,
                        modules: scan.modules,
                        runtimes: runtimes.filter((runtime) =>
                          matchesProjectObservation(
                            runtime,
                            project.name,
                            workspaceName,
                            scan.modules.map((module) => module.name),
                          ),
                        ),
                        runtimeIssue,
                      } satisfies ProjectObservation
                    }),
                  )
                : Effect.succeed<ProjectObservation>({
                    projectName: project.name,
                    repoPath: repo.repoPath,
                    repoKind: repo.kind,
                    workspaceName: null,
                    workspacePath: null,
                    modules: [],
                    runtimes: runtimes.filter((runtime) =>
                      matchesProjectObservation(runtime, project.name, null, []),
                    ),
                    runtimeIssue,
                  }),
            ),
          ),
        ),
      ),
    ),
  )
}

function getWorkspaceName(repoKind: 'bare' | 'standard', workspacePath: string) {
  return repoKind === 'standard' ? 'main' : path.basename(workspacePath)
}

function matchesProjectObservation(
  runtime: ProjectObservation['runtimes'][number],
  projectName: string,
  workspaceName: string | null,
  moduleNames: string[],
) {
  if (runtime.projectName !== projectName) {
    return false
  }

  if (runtime.scope === 'project') {
    return true
  }

  if (!workspaceName || runtime.workspaceName !== workspaceName) {
    return false
  }

  return runtime.scope !== 'module' || moduleNames.includes(runtime.moduleName ?? '')
}
