import type { ModuleSelector, ProjectConfig } from '@harbr/domain'
import type { HarbourThemeInput } from './schema'

export type HarbourModuleSelector = ModuleSelector
export type HarbourProject = ProjectConfig
export type HarbourTheme = HarbourThemeInput

export type HarbourConfig = {
  $schema?: string
  configPath: string
  projects: HarbourProject[]
  theme: HarbourTheme
}
