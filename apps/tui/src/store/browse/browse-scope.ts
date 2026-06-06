export type BrowseScope =
  | { level: 'projects' }
  | { level: 'workspaces'; projectId: string }
  | { entry: 'explicit' | 'implicit-default'; level: 'modules'; projectId: string; workspaceId: string }

export function projectsScope(): BrowseScope {
  return { level: 'projects' }
}

export function workspacesScope(projectId: string): BrowseScope {
  return { level: 'workspaces', projectId }
}

export function modulesScope(
  projectId: string,
  workspaceId: string,
  entry: 'explicit' | 'implicit-default' = 'explicit',
): BrowseScope {
  return { entry, level: 'modules', projectId, workspaceId }
}
