import type { RuntimeFact, RuntimeIssue, WindowConfig } from '@harbour/domain'

export type RuntimeDiscovery = {
  runtimes: RuntimeFact[]
  runtimeIssue: RuntimeIssue | null
}

export type CurrentRuntime = RuntimeFact | null

export type RuntimeTarget = {
  cwd: string
  moduleName: string | null
  projectName: string
  workspaceName: string | null
}

export type CreateRuntimeWindowsResult = {
  createdWindowNames: readonly string[]
  skippedWindowNames: readonly string[]
}

export type RuntimeWindowCreation = {
  target: RuntimeTarget
  windows: readonly WindowConfig[]
}
