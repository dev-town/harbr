import type { HarbourSection, VisibilityFilter } from '../../types/navigation'
import { createListState, type ListState } from '../shared/list-state'
import { projectsScope, type BrowseScope } from './browse-scope'

export type BrowseState = {
  list: ListState
  scope: BrowseScope
  visibility: VisibilityFilter
}

export function createBrowseState(): BrowseState {
  return {
    list: createListState(),
    scope: projectsScope(),
    visibility: 'active',
  }
}

export function getBrowseSection(scope: BrowseScope): HarbourSection {
  return scope.level
}

export function getSelectedProjectId(scope: BrowseScope) {
  return scope.level === 'projects' ? null : scope.projectId
}

export function getSelectedWorkspaceId(scope: BrowseScope) {
  return scope.level === 'modules' ? scope.workspaceId : null
}

export function isImplicitWorkspace(scope: BrowseScope) {
  return scope.level === 'modules' && scope.entry === 'implicit-default'
}
