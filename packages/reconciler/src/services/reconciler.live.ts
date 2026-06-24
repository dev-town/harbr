import { ConfigService, makeConfigServiceLayer } from '@harbr/config'
import { ProjectService, makeProjectServiceLayer } from '@harbr/db'
import { ScannerService, makeScannerServiceLayer } from '@harbr/scanner'
import { Effect, Layer } from 'effect'

import { refreshNamedProject, syncProjects } from '../reconciler.operations'
import { refreshProjectProgram, syncProgram } from '../reconciler.programs'
import {
  ReconcilerService,
  type ReconcilerServiceApi,
} from './reconciler.service'

export type ReconcilerOptions = {
  configPath?: string
  dbPath?: string
}

export function sync(options: ReconcilerOptions = {}) {
  return syncProgram.pipe(Effect.provide(makeReconcilerLayer(options)))
}

export function refreshProject(
  projectName: string,
  options: ReconcilerOptions = {},
) {
  return refreshProjectProgram(projectName).pipe(
    Effect.provide(makeReconcilerLayer(options)),
  )
}

export const ReconcilerServiceLive = Layer.effect(
  ReconcilerService,
  Effect.gen(function* () {
    const config = yield* ConfigService
    const scanner = yield* ScannerService
    const projectService = yield* ProjectService

    return {
      sync: syncProjects(config, scanner, projectService),
      refreshProject: (projectName) =>
        refreshNamedProject(config, scanner, projectService, projectName),
    } satisfies ReconcilerServiceApi
  }),
)

export function makeReconcilerLayer(options: ReconcilerOptions = {}) {
  const configLayer = makeConfigServiceLayer(options.configPath)
  const scannerLayer = makeScannerServiceLayer()
  const projectLayer = makeProjectServiceLayer(options.dbPath)

  return ReconcilerServiceLive.pipe(
    Layer.provide(projectLayer),
    Layer.provide(scannerLayer),
    Layer.provide(configLayer),
  )
}
