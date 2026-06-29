import { randomUUID } from 'node:crypto'

import { hasFlag, readArgValue } from '~/helpers/args'
import type { TuiProfileOptions } from '~/types'

const defaultEndpoint = 'http://localhost:4318'

export function readProfileOptions(
  args: string[],
): TuiProfileOptions | undefined {
  const enabled =
    hasFlag(args, '--profile') || process.env.HARBR_PROFILE === '1'

  if (!enabled) {
    return undefined
  }

  return {
    endpoint:
      readArgValue(args, '--profile-endpoint') ??
      process.env.HARBR_OTLP_ENDPOINT ??
      defaultEndpoint,
    sessionId: randomUUID(),
  }
}

export function getProfileMissingValueFlag(args: string[]) {
  return ['--profile-endpoint'].find((flag) => {
    const flagIndex = args.indexOf(flag)
    return flagIndex >= 0 && !args[flagIndex + 1]
  })
}

export async function checkProfileEndpoint(endpoint: string) {
  try {
    await fetch(endpoint, { method: 'GET' })
    return true
  } catch {
    return false
  }
}

export function formatProfileEndpointError(endpoint: string) {
  return [
    `profiling enabled, but no OTLP endpoint was reachable at ${endpoint}`,
    'Run: harbr profile up',
  ].join('\n')
}
