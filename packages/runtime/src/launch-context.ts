export type RuntimeProviderSelection = 'herdr' | 'tmux'

export function resolveRuntimeProvider(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): RuntimeProviderSelection {
  return environment.HERDR_SOCKET_PATH ||
    environment.HERDR_WORKSPACE_ID ||
    environment.HERDR_PANE_ID
    ? 'herdr'
    : 'tmux'
}
