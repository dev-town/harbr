import type { TuiStore } from '../app-context'
import { visibleActiveRowsAtom, selectedActiveRowIdAtom } from '../routes/active'
import {
  browseRowsAtom,
  browseQueryAtom,
  browseSectionAtom,
  selectedBrowseRowIdAtom,
  selectedProjectIdAtom,
  selectedWorkspaceIdAtom,
  selectedWorkspaceImplicitAtom,
  hoveredBrowseRowIdAtom,
} from '../routes/browse'
import {
  isLoadingAtom,
  moduleRowsAtom,
  noticeAtom,
  workspaceRowsAtom,
} from '../state'
import { activeQueryAtom, hoveredActiveRowIdAtom } from '../routes/active'

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

export function resetActiveSelection(store: TuiStore) {
  store.set(selectedActiveRowIdAtom, store.get(visibleActiveRowsAtom)[0]?.id ?? null)
  store.set(hoveredActiveRowIdAtom, null)
}

export function resetQuery(store: TuiStore) {
  store.set(browseQueryAtom, '')
}

export function resetActiveQuery(store: TuiStore) {
  store.set(activeQueryAtom, '')
}

export function resetProjectScope(store: TuiStore) {
  store.set(browseSectionAtom, 'projects')
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
