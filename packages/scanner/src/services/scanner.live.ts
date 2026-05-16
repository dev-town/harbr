import { Effect, Layer } from 'effect'

import { GitService, makeGitServiceLayer } from '@harbour/git'
import type { ProjectConfig } from '@harbour/domain'
import { observeProjectWithGit } from '../scanner.observe'
import { ScannerService, type ScannerServiceApi } from './scanner.service'

export const ScannerServiceLive = Layer.effect(
  ScannerService,
  Effect.gen(function* () {
    const git = yield* GitService

    return {
      observeProject: (project: ProjectConfig) => observeProjectWithGit(git, project),
    } satisfies ScannerServiceApi
  }),
)

export function makeScannerServiceLayer() {
  return ScannerServiceLive.pipe(Layer.provide(makeGitServiceLayer()))
}

export function observeProject(project: ProjectConfig) {
  return Effect.flatMap(ScannerService, (service) =>
    service.observeProject(project),
  ).pipe(Effect.provide(makeScannerServiceLayer()))
}
