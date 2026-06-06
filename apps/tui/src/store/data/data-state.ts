import type { ActiveRuntimeRow, ModuleRow, ProjectRow, WorkspaceRow } from '../../types/rows'

export type DataState = {
  activeRuntimeRows: readonly ActiveRuntimeRow[]
  moduleRows: readonly ModuleRow[]
  projectRows: readonly ProjectRow[]
  workspaceRows: readonly WorkspaceRow[]
}

export function createDataState(): DataState {
  return {
    activeRuntimeRows: [],
    moduleRows: [],
    projectRows: [],
    workspaceRows: [],
  }
}
