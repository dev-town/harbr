import type { TuiAppContext } from '../app-context'
import {
  currentSectionAtom,
  loadingAtom,
  moduleRowsAtom,
  noticeAtom,
  queryAtom,
  selectedIndexAtom,
  selectedProjectIdAtom,
  selectedWorkspaceIdAtom,
  selectedWorkspaceImplicitAtom,
  workspaceRowsAtom,
} from '../state'

export function clearNotice(context: TuiAppContext) {
  context.store.set(noticeAtom, null)
}

export function setLoading(context: TuiAppContext, isLoading: boolean) {
  context.store.set(loadingAtom, isLoading)
}

export function resetSelection(context: TuiAppContext) {
  context.store.set(selectedIndexAtom, 0)
}

export function resetQuery(context: TuiAppContext) {
  context.store.set(queryAtom, '')
}

export function resetProjectScope(context: TuiAppContext) {
  context.store.set(currentSectionAtom, 'projects')
  context.store.set(moduleRowsAtom, [])
  context.store.set(workspaceRowsAtom, [])
  context.store.set(selectedProjectIdAtom, null)
  context.store.set(selectedWorkspaceIdAtom, null)
  context.store.set(selectedWorkspaceImplicitAtom, false)
  resetSelection(context)
  clearNotice(context)
}

export function resetWorkspaceScope(context: TuiAppContext) {
  context.store.set(moduleRowsAtom, [])
  context.store.set(selectedWorkspaceIdAtom, null)
  context.store.set(selectedWorkspaceImplicitAtom, false)
  resetSelection(context)
  clearNotice(context)
}
