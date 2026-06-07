import type { InputRenderable } from '@opentui/core'
import { useEffect, useMemo, useRef } from 'react'

import { openActiveRuntime } from '../../../actions/runtime'
import { useRegisterFocusTarget } from '../../../hooks/useRegisterFocusTarget'
import { useTuiServices } from '../../../hooks/useTuiServices'
import type { ActiveRuntimeRow } from '../../../types/rows'
import {
  selectIsActiveActionsOpen,
  selectIsWindowPickerOpen,
  selectVisibleActiveRows,
  tuiStore,
  useTuiStore,
} from '../../../store'
import { useActiveKeybindings } from './use-active-keybindings'

export function useActiveRoute() {
  const services = useTuiServices()
  const searchRef = useRef<InputRenderable | null>(null)
  const focusSearchNonce = useTuiStore(
    (state) => state.surfaces.focusRequestKey,
  )
  const isActionsOpen = useTuiStore(selectIsActiveActionsOpen)
  const isWindowPickerOpen = useTuiStore(selectIsWindowPickerOpen)
  const query = useTuiStore((state) => state.active.list.query)
  const selectedId = useTuiStore((state) => state.active.list.selectedId)
  const sourceRows = useTuiStore((state) => state.data.activeRuntimeRows)
  const currentRuntime = useTuiStore((state) => state.app.currentRuntime)
  const onSelectRow = useTuiStore((state) => state.selectActiveRow)
  const rows = useMemo(
    () => selectVisibleActiveRows(tuiStore.getState()),
    [currentRuntime, query, sourceRows],
  )
  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  )

  useRegisterFocusTarget('browser', searchRef)
  useActiveKeybindings(searchRef)

  useEffect(() => {
    if (isActionsOpen || isWindowPickerOpen) {
      return
    }

    searchRef.current?.focus?.()
  }, [focusSearchNonce, isActionsOpen, isWindowPickerOpen, rows.length, selectedId])

  return {
    hoveredId: useTuiStore((state) => state.active.list.hoveredId),
    isLoading: useTuiStore((state) => state.app.isLoading),
    onHoverRow: useTuiStore((state) => state.hoverActiveRow),
    onOpenActions: useTuiStore((state) => state.openActiveActionsMenu),
    onOpenRow: (row: ActiveRuntimeRow) =>
      void openActiveRuntime(services, tuiStore, row),
    onSearchChange: useTuiStore((state) => state.changeActiveQuery),
    onSelectRow,
    placeholder: 'Filter active sessions',
    query,
    rows,
    searchRef,
    searchFocused: !isActionsOpen && !isWindowPickerOpen,
    selectedId,
    selectedRow,
  }
}
