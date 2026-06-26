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
import {
  RuntimeDiscoveryServiceLive,
  RuntimeTmuxServiceLive,
} from '@harbr/runtime-tmux'
import { ScannerServiceLive } from '@harbr/scanner'
import { Layer } from 'effect'

import type { TuiOptions } from '../types'

export function makeTuiLayer(options: TuiOptions) {
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
    Layer.provide(Layer.mergeAll(GitServiceLive, RuntimeDiscoveryServiceLive)),
  )
  const reconciler = ReconcilerServiceLive.pipe(
    Layer.provide(Layer.mergeAll(projectService, scanner)),
  )

  return Layer.mergeAll(
    config,
    database,
    GitServiceLive,
    RuntimeDiscoveryServiceLive,
    RuntimeTmuxServiceLive,
    projectService,
    scanner,
    reconciler,
  )
}
