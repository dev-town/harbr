import type { ModuleSelector, ProjectConfig } from '@harbour/domain'

export type HarbourModuleSelector = ModuleSelector
export type HarbourProject = ProjectConfig

export type HarbourConfig = {
  $schema?: string
  configPath: string
  projects: ProjectConfig[]
}
