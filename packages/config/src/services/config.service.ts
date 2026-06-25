import { Context, type Effect } from 'effect'
import type { HarbourConfigError } from '../config.errors'
import type { HarbourConfig } from '../config.types'

export type ConfigServiceOptionsApi = {
  readonly defaultConfigPath: string
}

export class ConfigServiceOptions extends Context.Tag(
  '@harbr/config/ConfigServiceOptions',
)<ConfigServiceOptions, ConfigServiceOptionsApi>() {}

export type ConfigServiceApi = {
  readonly load: Effect.Effect<HarbourConfig, HarbourConfigError>
  readonly loadAtPath: (
    configPath: string,
  ) => Effect.Effect<HarbourConfig, HarbourConfigError>
}

export class ConfigService extends Context.Tag('@harbr/config/ConfigService')<
  ConfigService,
  ConfigServiceApi
>() {}
