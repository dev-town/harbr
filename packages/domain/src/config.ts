export type ModuleSelector = {
  raw: string
  path: string
  mode: 'children' | 'explicit'
}

export type ProjectConfig = {
  name: string
  repo: string
  modules: ModuleSelector[]
}

export type ResolvedModule = {
  name: string
  path: string
  workspacePath: string
  selector: ModuleSelector
}
