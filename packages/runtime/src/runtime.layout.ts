import { isAbsolute, join } from 'node:path'

import type { WindowPaneConfig } from '@harbr/domain'

export function normalizeRuntimePaneCommands(command: WindowPaneConfig['command']) {
  if (!command) {
    return []
  }

  return typeof command === 'string' ? [command] : command
}

export function resolveRuntimePaneCwd(runtimeCwd: string, paneCwd: string | undefined) {
  if (!paneCwd) {
    return runtimeCwd
  }

  return isAbsolute(paneCwd) ? paneCwd : join(runtimeCwd, paneCwd)
}
