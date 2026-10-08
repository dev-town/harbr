import type {
  CurrentRuntime,
  RuntimeDiscovery,
  RuntimeIdentity,
  RuntimeSource,
  RuntimeTarget,
  WindowConfig,
} from '@harbr/domain'

export type CreateRuntimeWindowsResult = {
  createdWindowNames: readonly string[]
  skippedWindowNames: readonly string[]
}

export type RuntimeWindowCreation = {
  target: RuntimeTarget
  windows: readonly WindowConfig[]
}

export type { CurrentRuntime, RuntimeDiscovery, RuntimeIdentity, RuntimeSource, RuntimeTarget }
