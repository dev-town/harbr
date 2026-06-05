import type { InputRenderable } from '@opentui/core'
import { useAtomValue, useSetAtom, useStore } from 'jotai'
import { useEffect, useRef } from 'react'

import { openActiveRuntime } from '../../../actions/runtime'
import { useRegisterFocusTarget } from '../../../hooks/useRegisterFocusTarget'
import { useTuiServices } from '../../../hooks/useTuiServices'
import { isLoadingAtom } from '../../../state/app'
import type { ActiveRuntimeRow } from '../../../types/rows'
import {
  isActionsOpenAtom,
  activeQueryAtom,
  activeSearchFocusNonceAtom,
  selectedActiveRowIdAtom,
  hoveredActiveRowIdAtom,
} from '../atoms'
import { changeActiveQueryAtom, hoverActiveRowAtom, openActionsMenuAtom, selectActiveRowAtom } from '../state/actions'
import { selectedActiveRowAtom, visibleActiveRowsAtom } from '../derived'

export function useActiveRoute() {
  const services = useTuiServices()
  const searchRef = useRef<InputRenderable | null>(null)
  const store = useStore()
  const focusSearchNonce = useAtomValue(activeSearchFocusNonceAtom)
  const isActionsOpen = useAtomValue(isActionsOpenAtom)
  const query = useAtomValue(activeQueryAtom)
  const selectedId = useAtomValue(selectedActiveRowIdAtom)
  const rows = useAtomValue(visibleActiveRowsAtom)
  const onSelectRow = useSetAtom(selectActiveRowAtom)

  useRegisterFocusTarget('browser', searchRef)

  useEffect(() => {
    if (isActionsOpen) {
      return
    }

    searchRef.current?.focus?.()
  }, [focusSearchNonce, isActionsOpen, rows.length, selectedId])

  return {
    hoveredId: useAtomValue(hoveredActiveRowIdAtom),
    isLoading: useAtomValue(isLoadingAtom),
    onHoverRow: useSetAtom(hoverActiveRowAtom),
    onOpenActions: useSetAtom(openActionsMenuAtom),
    onOpenRow: (row: ActiveRuntimeRow) => void openActiveRuntime(services, store, row),
    onSearchChange: useSetAtom(changeActiveQueryAtom),
    onSelectRow,
    placeholder: 'Filter active sessions',
    query,
    rows,
    searchRef,
    searchFocused: !isActionsOpen,
    selectedId,
    selectedRow: useAtomValue(selectedActiveRowAtom),
  }
}
