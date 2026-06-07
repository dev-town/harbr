import type {
  RuntimeFact,
  RuntimeIssue,
  RuntimeTarget,
  WindowConfig,
} from '@harbour/domain'

export type RuntimeDiscovery = {
  runtimes: RuntimeFact[]
  runtimeIssue: RuntimeIssue | null
}

export type CurrentRuntime = RuntimeFact | null

export type CreateRuntimeWindowsResult = {
  createdWindowNames: readonly string[]
  skippedWindowNames: readonly string[]
}

export type RuntimeWindowCreation = {
  target: RuntimeTarget
  windows: readonly WindowConfig[]
}
