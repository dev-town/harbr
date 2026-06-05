import type { InputRenderable } from '@opentui/core'
import { useAtomValue, useSetAtom, useStore } from 'jotai'
import { useEffect, useRef } from 'react'

import { openActiveRuntime } from '../../../actions/runtime'
import { useRegisterFocusTarget } from '../../../hooks/useRegisterFocusTarget'
import { useTuiServices } from '../../../hooks/useTuiServices'
import { isLoadingAtom } from '../../../state/app'
import type { ActiveRuntimeRow } from '../../../types/rows'
import {
  activeQueryAtom,
  activeSearchFocusNonceAtom,
  selectedActiveRowIdAtom,
  hoveredActiveRowIdAtom,
} from '../atoms'
import { changeActiveQueryAtom, hoverActiveRowAtom, selectActiveRowAtom } from '../state/actions'
import { selectedActiveRowAtom, visibleActiveRowsAtom } from '../derived'

export function useActiveRoute() {
  const services = useTuiServices()
  const store = useStore()
  const searchRef = useRef<InputRenderable | null>(null)
  const focusSearchNonce = useAtomValue(activeSearchFocusNonceAtom)
  const query = useAtomValue(activeQueryAtom)
  const selectedId = useAtomValue(selectedActiveRowIdAtom)
  const rows = useAtomValue(visibleActiveRowsAtom)
  const onSelectRow = useSetAtom(selectActiveRowAtom)

  useRegisterFocusTarget('browser', searchRef)

  useEffect(() => {
    searchRef.current?.focus?.()
  }, [focusSearchNonce, rows.length, selectedId])

  return {
    hoveredId: useAtomValue(hoveredActiveRowIdAtom),
    isLoading: useAtomValue(isLoadingAtom),
    onHoverRow: useSetAtom(hoverActiveRowAtom),
    onOpenRow: (row: ActiveRuntimeRow) => void openActiveRuntime(services, store, row),
    onSearchChange: useSetAtom(changeActiveQueryAtom),
    onSelectRow,
    placeholder: 'Filter active sessions',
    query,
    rows,
    searchRef,
    selectedId,
    selectedRow: useAtomValue(selectedActiveRowAtom),
  }
}
