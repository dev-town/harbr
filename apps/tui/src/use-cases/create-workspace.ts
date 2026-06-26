import { ConfigService } from '@harbr/config'
import { GitService } from '@harbr/git'
import { ReconcilerService } from '@harbr/reconciler'
import { Effect } from 'effect'

import type { TuiServices } from '../app-context'

export type CreateWorkspaceInput = {
  branchName: string
  projectName: string
  repoPath: string
  workspaceName: string
}

export async function createWorkspace(
  services: TuiServices,
  input: CreateWorkspaceInput,
) {
  return services.effectRuntime.runPromise(
    Effect.gen(function* () {
      const git = yield* GitService
      const repo = yield* git.inspectRepo(input.repoPath)

      yield* git.createWorktree(repo, {
        branchName: input.branchName,
        workspaceName: input.workspaceName,
      })

      const configService = yield* ConfigService
      const config = yield* configService.load
      const projectConfig = config.projects.find(
        (project) => project.name === input.projectName,
      )

      if (!projectConfig) {
        return yield* Effect.fail(
          new Error(`Project config not found: ${input.projectName}`),
        )
      }

      const reconciler = yield* ReconcilerService

      return yield* reconciler.refreshProject(projectConfig)
    }),
  )
}
