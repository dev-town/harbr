export const browseActionIds = {
  closeRuntimeSession: 'action.close_runtime_session',
  createWorkspace: 'action.create_workspace',
  createModuleWindows: 'action.create_module_windows',
  createProjectWindows: 'action.create_project_windows',
  createWorkspaceWindows: 'action.create_workspace_windows',
  openModuleSession: 'action.open_module_session',
  openProjectRoot: 'action.open_project_root',
  openWorkspaceRoot: 'action.open_workspace_root',
} as const

export type BrowseActionId =
  (typeof browseActionIds)[keyof typeof browseActionIds]
