import type { WorkspaceProvider } from '@harbr/domain'

const workspaceProviderLabels: Readonly<Record<string, string>> = {
  amp: 'Amp',
  claude: 'Claude',
  codex: 'Codex',
  external: 'External',
  harbr: 'Harbr',
  local: 'Local',
  opencode: 'OpenCode',
}

export function formatWorkspaceProvider(provider: WorkspaceProvider) {
  return workspaceProviderLabels[provider] ?? provider
}
