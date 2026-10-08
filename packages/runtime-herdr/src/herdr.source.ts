import type { RuntimeSource } from '@harbr/domain'

export function getHerdrRuntimeSource(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): RuntimeSource {
  return {
    provider: 'herdr',
    sourceId:
      environment.HERDR_SOCKET_PATH?.trim() ||
      (environment.HERDR_SESSION ? `session:${environment.HERDR_SESSION}` : 'current'),
  }
}
