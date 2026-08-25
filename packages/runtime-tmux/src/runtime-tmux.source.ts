import type { RuntimeSource } from '@harbr/domain'

export function getTmuxRuntimeSource(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): RuntimeSource {
  const socketPath = environment.TMUX?.split(',', 1)[0]?.trim()

  return {
    provider: 'tmux',
    sourceId: socketPath || 'default',
  }
}
