import { Effect, Layer } from 'effect'

import { GitService } from '@harbr/git'
import { RuntimeDiscoveryService } from '@harbr/runtime-tmux/discovery'
import type { ProjectConfig } from '@harbr/domain'
import {
  observeProjectsWithGit,
  observeProjectWithGit,
} from '../scanner.observe'
import { ScannerService, type ScannerServiceApi } from './scanner.service'

export const ScannerServiceLive = Layer.effect(
  ScannerService,
  Effect.gen(function* () {
    const git = yield* GitService
    const runtimeDiscovery = yield* RuntimeDiscoveryService

    return {
      observeProjects: (projects: readonly ProjectConfig[]) =>
        observeProjectsWithGit(git, runtimeDiscovery, projects),
      observeProject: (project: ProjectConfig) =>
        observeProjectWithGit(git, runtimeDiscovery, project),
    } satisfies ScannerServiceApi
  }),
)
