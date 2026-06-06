import type { InputRenderable } from '@opentui/core'
import { useEffect, useMemo, useRef } from 'react'

import { getPlaceholder } from '../../../helpers/labels'
import { useRegisterFocusTarget } from '../../../hooks/useRegisterFocusTarget'
import { selectCurrentBrowseSection, selectIsBrowseActionsOpen, selectIsWorktreeFormOpen, selectVisibleBrowseRows, tuiStore, useTuiStore } from '../../../store'

export function useBrowseSearch() {
  const searchRef = useRef<InputRenderable | null>(null)
  const currentSection = useTuiStore(selectCurrentBrowseSection)
  const query = useTuiStore((state) => state.browse.list.query)
  const focusSearchNonce = useTuiStore((state) => state.surfaces.focusRequestKey)
  const selectedId = useTuiStore((state) => state.browse.list.selectedId)
  const projectRows = useTuiStore((state) => state.data.projectRows)
  const workspaceRows = useTuiStore((state) => state.data.workspaceRows)
  const moduleRows = useTuiStore((state) => state.data.moduleRows)
  const currentRuntime = useTuiStore((state) => state.app.currentRuntime)
  const scope = useTuiStore((state) => state.browse.scope)
  const visibility = useTuiStore((state) => state.browse.visibility)
  const rows = useMemo(
    () => selectVisibleBrowseRows(tuiStore.getState()),
    [currentRuntime, moduleRows, projectRows, query, scope, visibility, workspaceRows],
  )
  const isActionsOpen = useTuiStore(selectIsBrowseActionsOpen)
  const isWorktreeFormOpen = useTuiStore(selectIsWorktreeFormOpen)
  const isSearchFocused = !isActionsOpen && !isWorktreeFormOpen

  useRegisterFocusTarget('browser', searchRef)

  useEffect(() => {
    if (!isSearchFocused) {
      return
    }

    searchRef.current?.focus?.()
  }, [focusSearchNonce, isSearchFocused, rows.length, selectedId])

  return {
    onSearchChange: useTuiStore((state) => state.changeBrowseQuery),
    placeholder: getPlaceholder(currentSection, 'browse'),
    query,
    searchFocused: isSearchFocused,
    searchRef,
  }
}
