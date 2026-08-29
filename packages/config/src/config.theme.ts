import { readFile } from 'node:fs/promises'

import type { HarbourTheme } from './config.types'
import { getDefaultConfigPath, resolveTopLevelPath } from './config.path'
import { configSchema } from './schema'

export type ConfigThemeResult = {
  loaded: boolean
  theme: HarbourTheme
}

export async function readConfigTheme(
  configPath = getDefaultConfigPath(),
): Promise<ConfigThemeResult> {
  try {
    const rawConfig = await readFile(resolveTopLevelPath(configPath), 'utf8')
    const parsedConfig = configSchema.safeParse(JSON.parse(rawConfig))

    return parsedConfig.success
      ? { loaded: true, theme: parsedConfig.data.theme ?? 'system' }
      : { loaded: false, theme: 'system' }
  } catch {
    return { loaded: false, theme: 'system' }
  }
}
