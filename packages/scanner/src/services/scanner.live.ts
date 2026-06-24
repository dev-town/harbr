import { Effect, Layer } from 'effect'

import { GitService, makeGitServiceLayer } from '@harbr/git'
import {
  makeRuntimeTmuxServiceLayer,
  RuntimeTmuxService,
} from '@harbr/runtime-tmux'
import type { ProjectConfig } from '@harbr/domain'
import { observeProjectWithGit } from '../scanner.observe'
import { ScannerService, type ScannerServiceApi } from './scanner.service'

export const ScannerServiceLive = Layer.effect(
  ScannerService,
  Effect.gen(function* () {
    const git = yield* GitService
    const runtimeTmux = yield* RuntimeTmuxService

    return {
      observeProject: (project: ProjectConfig) =>
        observeProjectWithGit(git, runtimeTmux, project),
    } satisfies ScannerServiceApi
  }),
)

export function makeScannerServiceLayer() {
  return ScannerServiceLive.pipe(
    Layer.provide(makeRuntimeTmuxServiceLayer()),
    Layer.provide(makeGitServiceLayer()),
  )
}

export function observeProject(project: ProjectConfig) {
  return Effect.flatMap(ScannerService, (service) =>
    service.observeProject(project),
  ).pipe(Effect.provide(makeScannerServiceLayer()))
}
