import type { ProjectConfig, ProjectObservation } from '@harbour/domain'
import type { GitServiceApi } from '@harbour/git'
import { Effect } from 'effect'

import { scanProject } from './scanner.scan'

export function observeProjectWithGit(git: GitServiceApi, project: ProjectConfig) {
  return git.inspectRepo(project.repo).pipe(
    Effect.flatMap((repo) =>
      git.resolveWorkspacePath(repo).pipe(
        Effect.flatMap((workspacePath) =>
          workspacePath
            ? scanProject(project, workspacePath).pipe(
                Effect.map(
                  (scan) =>
                    ({
                      projectName: project.name,
                      repoPath: scan.repoPath,
                      repoKind: repo.kind,
                      workspacePath: scan.workspacePath,
                      modules: scan.modules,
                    }) satisfies ProjectObservation,
                ),
              )
            : Effect.succeed<ProjectObservation>({
                projectName: project.name,
                repoPath: repo.repoPath,
                repoKind: repo.kind,
                workspacePath: null,
                modules: [],
              }),
        ),
      ),
    ),
  )
}
