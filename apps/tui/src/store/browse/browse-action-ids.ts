export const browseActionIds = {
  closeRuntimeSession: 'action.close_runtime_session',
  createWorkspace: 'action.create_workspace',
  openModuleSession: 'action.open_module_session',
  openProjectRoot: 'action.open_project_root',
  openWorkspaceRoot: 'action.open_workspace_root',
} as const

export type BrowseActionId =
  (typeof browseActionIds)[keyof typeof browseActionIds]
