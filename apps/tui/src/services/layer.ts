import {
  ConfigServiceLive,
  ConfigServiceOptions,
  ConfigServiceOptionsLive,
} from '@harbr/config'
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
  const runtimeDiscovery = isHerdr
    ? HerdrRuntimeDiscoveryServiceLive
    : TmuxRuntimeDiscoveryServiceLive
  const runtime = isHerdr ? HerdrRuntimeServiceLive : TmuxRuntimeServiceLive
  const configOptions = options.configPath
    ? Layer.succeed(ConfigServiceOptions, {
        defaultConfigPath: options.configPath,
      })
    : ConfigServiceOptionsLive

  const databaseOptions = options.dbPath
    ? Layer.succeed(DatabaseClientOptions, { dbPath: options.dbPath })
    : DatabaseClientOptionsLive

  const config = ConfigServiceLive.pipe(Layer.provide(configOptions))
  const database = DatabaseClientLive.pipe(Layer.provide(databaseOptions))
  const projectService = ProjectServiceLive.pipe(Layer.provide(database))
  const scanner = ScannerServiceLive.pipe(
    Layer.provide(Layer.mergeAll(GitServiceLive, runtimeDiscovery)),
  )
  const reconciler = ReconcilerServiceLive.pipe(
    Layer.provide(Layer.mergeAll(projectService, scanner)),
  )

  const appLayer = Layer.mergeAll(
    config,
    database,
    GitServiceLive,
    runtimeDiscovery,
    runtime,
    projectService,
    scanner,
    reconciler,
  )

  return options.profile
    ? Layer.mergeAll(appLayer, makeObservabilityLayer(options.profile))
    : appLayer
}
