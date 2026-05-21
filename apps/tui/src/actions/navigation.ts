import { harbourCommandIds } from '@harbour/domain'

import type { TuiAppContext } from '../app-context'
import { clampIndex } from '../helpers/selection'
import { currentSectionAtom, focusSearchNonceAtom, noticeAtom, queryAtom, selectedIndexAtom, selectedProjectIdAtom, selectedWorkspaceImplicitAtom, visibilityAtom, visibleRowsAtom, workspaceRowsAtom } from '../state'
import { openDefaultWorkspaceModules, openModules, openWorkspaces } from './drilldown'
import { loadProjects } from './refresh'
import { openModuleRuntime, openProjectRoot, openWorkspaceRoot } from './runtime'
import { clearNotice, resetProjectScope, resetSelection, resetWorkspaceScope } from './state'

export function moveSelection(context: TuiAppContext, delta: number) {
  const nextIndex = context.store.get(selectedIndexAtom) + delta
  context.store.set(selectedIndexAtom, clampIndex(nextIndex, context.store.get(visibleRowsAtom).length))
  clearNotice(context)
}

export function toggleVisibility(context: TuiAppContext) {
  context.store.set(visibilityAtom, (current) => (current === 'active' ? 'all' : 'active'))
  resetSelection(context)
  clearNotice(context)
}

export function handleEscape(context: TuiAppContext) {
  const query = context.store.get(queryAtom)

  if (query.length > 0) {
    context.store.set(queryAtom, '')
    resetSelection(context)
    clearNotice(context)
    return
  }

  if (context.store.get(currentSectionAtom) === 'workspaces') {
    resetProjectScope(context)
    return
  }

  if (context.store.get(currentSectionAtom) === 'modules') {
    if (context.store.get(selectedWorkspaceImplicitAtom)) {
      context.store.set(currentSectionAtom, 'projects')
      context.store.set(workspaceRowsAtom, [])
      context.store.set(selectedProjectIdAtom, null)
    } else {
      context.store.set(currentSectionAtom, 'workspaces')
    }

    resetWorkspaceScope(context)
    return
  }

  context.renderer.destroy()
}

export function handleSelect(context: TuiAppContext) {
  const row = context.store.get(visibleRowsAtom)[context.store.get(selectedIndexAtom)]

  if (!row) {
    return
  }

  if (row.kind === 'workspace') {
    if (row.hasModules) {
      void openModules(context, row.projectId, row.workspaceId)
      return
    }

    void openWorkspaceRoot(context, row)
    return
  }

  if (row.kind !== 'project') {
    if (row.kind === 'module') {
      void openModuleRuntime(context, row)
    }

    return
  }

  if (row.hasWorkspaces) {
    void openWorkspaces(context, row.projectId)
    return
  }

  if (row.hasModules) {
    void openDefaultWorkspaceModules(context, row.projectId)
    return
  }

  void openProjectRoot(context, row)
}

export function createBrowseCommandHandler(context: TuiAppContext) {
  return (commandId: string) => {
    switch (commandId) {
      case harbourCommandIds.appQuit:
        context.renderer.destroy()
        return
      case harbourCommandIds.browseUp:
        moveSelection(context, -1)
        return
      case harbourCommandIds.browseDown:
        moveSelection(context, 1)
        return
      case harbourCommandIds.browseToggleVisibility:
        toggleVisibility(context)
        return
      case harbourCommandIds.browseRefresh:
        void loadProjects(context)
        return
      case harbourCommandIds.browseBack:
        handleEscape(context)
        return
      case harbourCommandIds.browseSelect:
        handleSelect(context)
        return
      case harbourCommandIds.browseOpenActions:
        context.store.set(noticeAtom, 'Actions menu next')
        return
      case harbourCommandIds.browseFocusSearch:
        context.store.set(focusSearchNonceAtom, (current) => current + 1)
        return
    }
  }
}
