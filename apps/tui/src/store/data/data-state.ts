import type { WindowConfig } from '@harbour/domain'

import type { ActiveRuntimeRow, ModuleRow, ProjectRow, WorkspaceRow } from '../../types/rows'

export type ProjectWindowConfig = {
  projectId: string
  projectName: string
  windows: readonly WindowConfig[]
}

export type DataState = {
  activeRuntimeRows: readonly ActiveRuntimeRow[]
  moduleRows: readonly ModuleRow[]
  projectWindows: readonly ProjectWindowConfig[]
  projectRows: readonly ProjectRow[]
  workspaceRows: readonly WorkspaceRow[]
}

export function createDataState(): DataState {
  return {
    activeRuntimeRows: [],
    moduleRows: [],
    projectWindows: [],
    projectRows: [],
    workspaceRows: [],
  }
}
