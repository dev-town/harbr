import type { TuiStore } from '../app-context'
import {
  browseQueryAtom,
  browseRowsAtom,
  currentSectionAtom,
  hoveredBrowseRowIdAtom,
  isLoadingAtom,
  moduleRowsAtom,
  noticeAtom,
  selectedBrowseRowIdAtom,
  selectedProjectIdAtom,
  selectedWorkspaceIdAtom,
  selectedWorkspaceImplicitAtom,
  workspaceRowsAtom,
} from '../state'

export function clearNotice(store: TuiStore) {
  store.set(noticeAtom, null)
}

export function setLoading(store: TuiStore, isLoading: boolean) {
  store.set(isLoadingAtom, isLoading)
}

export function resetSelection(store: TuiStore) {
  store.set(selectedBrowseRowIdAtom, store.get(browseRowsAtom)[0]?.id ?? null)
  store.set(hoveredBrowseRowIdAtom, null)
}

export function resetQuery(store: TuiStore) {
  store.set(browseQueryAtom, '')
}

export function resetProjectScope(store: TuiStore) {
  store.set(currentSectionAtom, 'projects')
  store.set(moduleRowsAtom, [])
  store.set(workspaceRowsAtom, [])
  store.set(selectedProjectIdAtom, null)
  store.set(selectedWorkspaceIdAtom, null)
  store.set(selectedWorkspaceImplicitAtom, false)
  resetSelection(store)
  clearNotice(store)
}

export function resetWorkspaceScope(store: TuiStore) {
  store.set(moduleRowsAtom, [])
  store.set(selectedWorkspaceIdAtom, null)
  store.set(selectedWorkspaceImplicitAtom, false)
  resetSelection(store)
  clearNotice(store)
}
