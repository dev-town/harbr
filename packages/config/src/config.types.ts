import type { ModuleSelector, ProjectConfig } from '@harbr/domain'

export type HarbourModuleSelector = ModuleSelector
export type HarbourProject = ProjectConfig

export type HarbourConfig = {
  $schema?: string
  configPath: string
  projects: HarbourProject[]
}
