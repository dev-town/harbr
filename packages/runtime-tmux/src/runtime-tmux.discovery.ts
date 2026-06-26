import type { RuntimeIssue } from '@harbr/domain'

export function classifyRuntimeDiscoveryIssue(
  message: string,
): RuntimeIssue | null | undefined {
  if (message.includes('no server running')) {
    return null
  }

  if (
    message.includes('error connecting') ||
    message.includes('failed to connect')
  ) {
    return 'tmux_unavailable'
  }

  return undefined
}
