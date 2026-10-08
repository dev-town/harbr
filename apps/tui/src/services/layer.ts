import { ConfigServiceLive, ConfigServiceOptions, ConfigServiceOptionsLive } from '@harbr/config'
import {
  DatabaseClientLive,
  DatabaseClientOptions,
  DatabaseClientOptionsLive,
  ProjectServiceLive,
} from '@harbr/db'
import { GitServiceLive } from '@harbr/git'
import { ReconcilerServiceLive } from '@harbr/reconciler'
import { resolveRuntimeProvider } from '@harbr/runtime'
import {
  RuntimeDiscoveryServiceLive as HerdrRuntimeDiscoveryServiceLive,
  RuntimeServiceLive as HerdrRuntimeServiceLive,
} from '@harbr/runtime-herdr'
import {
  RuntimeDiscoveryServiceLive as TmuxRuntimeDiscoveryServiceLive,
  RuntimeServiceLive as TmuxRuntimeServiceLive,
} from '@harbr/runtime-tmux'
import { ScannerServiceLive } from '@harbr/scanner'
import { Layer } from 'effect'

import { makeObservabilityLayer } from '~/observability/layer'
import type { TuiOptions } from '~/types'

export function makeTuiLayer(options: TuiOptions) {
  const isHerdr = resolveRuntimeProvider() === 'herdr'
  const runtime = isHerdr ? HerdrRuntimeServiceLive : TmuxRuntimeServiceLive
  const appLayer = Layer.mergeAll(
    makeConfigLayer(options),
    runtime,
    makeReconcilerLayer(options, isHerdr),
  )

  return options.profile
    ? Layer.mergeAll(appLayer, makeObservabilityLayer(options.profile))
    : appLayer
}

export function makeSyncLayer(options: TuiOptions) {
  return makeReconcilerLayer(options, resolveRuntimeProvider() === 'herdr')
}

export function makeConfigLayer(options: Pick<TuiOptions, 'configPath'>) {
  const configOptions = options.configPath
    ? Layer.succeed(ConfigServiceOptions, {
        defaultConfigPath: options.configPath,
      })
    : ConfigServiceOptionsLive

  return ConfigServiceLive.pipe(Layer.provide(configOptions))
}

function makeReconcilerLayer(options: TuiOptions, isHerdr: boolean) {
  const runtimeDiscovery = isHerdr
    ? HerdrRuntimeDiscoveryServiceLive
    : TmuxRuntimeDiscoveryServiceLive

  const databaseOptions = options.dbPath
    ? Layer.succeed(DatabaseClientOptions, { dbPath: options.dbPath })
    : DatabaseClientOptionsLive

  const database = DatabaseClientLive.pipe(Layer.provide(databaseOptions))
  const projectService = ProjectServiceLive.pipe(Layer.provideMerge(database))
  const scanner = ScannerServiceLive.pipe(
    Layer.provideMerge(Layer.mergeAll(GitServiceLive, runtimeDiscovery)),
  )

  return ReconcilerServiceLive.pipe(Layer.provideMerge(Layer.mergeAll(projectService, scanner)))
}
