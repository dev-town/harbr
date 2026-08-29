import type { RuntimeIssueCode } from '@harbr/domain'

export function classifyRuntimeDiscoveryIssue(
  message: string,
): RuntimeIssueCode | null | undefined {
  if (message.includes('no server running')) {
    return null
  }

  if (
    message.includes('error connecting') ||
    message.includes('failed to connect')
  ) {
    return 'source_unavailable'
  }

  return undefined
}
