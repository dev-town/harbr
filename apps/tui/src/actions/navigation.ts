import { harbourCommandIds } from '@harbour/domain'

import type { TuiAppContext } from '../app-context'
import { clampIndex } from '../helpers/selection'
import {
  currentSectionAtom,
  currentRowsAtom,
  focusSearchNonceAtom,
  queryAtom,
  selectedIndexAtom,
  selectedProjectIdAtom,
  selectedWorkspaceImplicitAtom,
  visibilityAtom,
  workspaceRowsAtom,
} from '../state'
import {
  openDefaultWorkspaceModules,
  openModules,
  openWorkspaces,
} from './drilldown'
import { dispatchCommand } from './dispatch'
import {
  openModuleRuntime,
  openProjectRoot,
  openWorkspaceRoot,
} from './runtime'
import {
  clearNotice,
  resetProjectScope,
  resetSelection,
  resetWorkspaceScope,
} from './state'

export function moveBrowseSelection(context: TuiAppContext, delta: number) {
  const nextIndex = context.store.get(selectedIndexAtom) + delta
  context.store.set(
    selectedIndexAtom,
    clampIndex(nextIndex, context.store.get(currentRowsAtom).length),
  )
  clearNotice(context)
}

export function toggleBrowseVisibility(context: TuiAppContext) {
  context.store.set(visibilityAtom, (current) =>
    current === 'active' ? 'all' : 'active',
  )
  resetSelection(context)
  clearNotice(context)
}

export function handleBrowseBack(context: TuiAppContext) {
  const query = context.store.get(queryAtom)
  const currentSection = context.store.get(currentSectionAtom)

  if (query.length > 0) {
    context.store.set(queryAtom, '')
    resetSelection(context)
    clearNotice(context)
    return
  }

  if (currentSection === 'workspaces') {
    resetProjectScope(context)
    return
  }

  if (currentSection === 'modules') {
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

export function handleBrowseSelect(context: TuiAppContext) {
  const row =
    context.store.get(currentRowsAtom)[context.store.get(selectedIndexAtom)]

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

export function focusBrowseSearch(context: TuiAppContext) {
  context.store.set(focusSearchNonceAtom, (current) => current + 1)
}

export function createBrowseCommandHandler(context: TuiAppContext) {
  return (commandId: string) =>
    dispatchCommand(
      context,
      commandId as (typeof harbourCommandIds)[keyof typeof harbourCommandIds],
    )
}
