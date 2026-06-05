import { atom } from 'jotai'

import { clampIndex } from '../../../../helpers/selection'
import { noticeAtom } from '../../../../state/app'
import {
  activeSearchFocusNonceAtom,
  hoveredActiveRowIdAtom,
  selectedActiveRowIdAtom,
} from '../atoms'
import { visibleActiveRowsAtom } from '../derived'

export const hoverActiveRowAtom = atom(null, (_get, set, rowId: string | null) => {
  set(hoveredActiveRowIdAtom, rowId)
})

export const selectActiveRowAtom = atom(null, (_get, set, rowId: string) => {
  set(selectedActiveRowIdAtom, rowId)
  set(activeSearchFocusNonceAtom, (current) => current + 1)
})

export const moveActiveSelectionAtom = atom(null, (get, set, delta: number) => {
  const rows = get(visibleActiveRowsAtom)
  const currentIndex = getIndexForRowId(rows, get(selectedActiveRowIdAtom))
  const nextIndex = clampIndex(currentIndex + delta, rows.length)

  set(selectedActiveRowIdAtom, rows[nextIndex]?.id ?? null)
  set(noticeAtom, null)
})

function getIndexForRowId(rows: readonly { id: string }[], rowId: string | null) {
  if (rows.length === 0) {
    return 0
  }

  const index = rowId ? rows.findIndex((row) => row.id === rowId) : -1

  return index >= 0 ? index : 0
}
