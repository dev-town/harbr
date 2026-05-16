import type { RuntimeFact, RuntimeIssue } from '@harbour/domain'

export type RuntimeDiscovery = {
  runtimes: RuntimeFact[]
  runtimeIssue: RuntimeIssue | null
}
