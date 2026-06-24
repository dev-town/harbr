import { useMemo } from 'react'

import {
  selectBrowseBreadcrumb,
  selectIsBrowseActionsOpen,
  selectIsWindowPickerOpen,
  selectIsWorktreeFormOpen,
  selectVisibleBrowseRows,
  tuiStore,
  useTuiStore,
} from '../../../store'
import { useBrowseSearch } from './use-browse-search'
import { useBrowseSection } from './use-browse-section'

export function useBrowseRoute() {
  const browseSearch = useBrowseSearch()
  const browseSection = useBrowseSection()
  const query = useTuiStore((state) => state.browse.list.query)
  const selectedId = useTuiStore((state) => state.browse.list.selectedId)
  const projectRows = useTuiStore((state) => state.data.projectRows)
  const workspaceRows = useTuiStore((state) => state.data.workspaceRows)
  const moduleRows = useTuiStore((state) => state.data.moduleRows)
  const currentRuntime = useTuiStore((state) => state.app.currentRuntime)
  const scope = useTuiStore((state) => state.browse.scope)
  const visibility = useTuiStore((state) => state.browse.visibility)
  const rows = useMemo(
    () => selectVisibleBrowseRows(tuiStore.getState()),
    [
      currentRuntime,
      moduleRows,
      projectRows,
      query,
      scope,
      visibility,
      workspaceRows,
    ],
  )
  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  )
  const breadcrumb = useMemo(
    () => selectBrowseBreadcrumb(tuiStore.getState()),
    [projectRows, scope, workspaceRows],
  )

  return {
    currentSection: browseSection.currentSection,
    breadcrumb,
    hoveredId: useTuiStore((state) => state.browse.list.hoveredId),
    isLoading: useTuiStore((state) => state.app.isLoading),
    onBack: () => {
      if (selectIsWorktreeFormOpen(tuiStore.getState())) {
        tuiStore.getState().backWorktreeForm()
        return
      }

      if (selectIsBrowseActionsOpen(tuiStore.getState())) {
        tuiStore.getState().closeActionsMenu()
        return
      }

      if (selectIsWindowPickerOpen(tuiStore.getState())) {
        tuiStore.getState().closeWindowPicker()
        return
      }

      if (query.length > 0) {
        tuiStore.getState().resetBrowseQuery()
        tuiStore.getState().resetBrowseSelection()
        tuiStore.getState().clearNotice()
        return
      }

      browseSection.onBack()
    },
    onHoverRow: useTuiStore((state) => state.hoverBrowseRow),
    onOpenActions: useTuiStore((state) => state.openBrowseActionsMenu),
    onOpenRow: browseSection.onOpenRow,
    onSearchChange: browseSearch.onSearchChange,
    onSelectRow: useTuiStore((state) => state.selectBrowseRow),
    placeholder: browseSearch.placeholder,
    query: browseSearch.query,
    rows,
    searchRef: browseSearch.searchRef,
    searchFocused: browseSearch.searchFocused,
    selectedId,
    selectedRow,
    visibility,
  }
}
