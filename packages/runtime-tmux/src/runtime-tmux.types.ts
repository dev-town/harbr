import type { RuntimeFact, RuntimeIssue } from '@harbour/domain'

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
