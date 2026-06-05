import { atom } from 'jotai'

import { clampIndex } from '../../../../helpers/selection'
import { noticeAtom } from '../../../../state/app'
import {
  browseSearchFocusNonceAtom,
  hoveredBrowseRowIdAtom,
  selectedBrowseRowIdAtom,
} from '../atoms'
import { visibleBrowseRowsAtom } from '../derived'

export const hoverBrowseRowAtom = atom(null, (_get, set, rowId: string | null) => {
  set(hoveredBrowseRowIdAtom, rowId)
})

export const selectBrowseRowAtom = atom(null, (_get, set, rowId: string) => {
  set(selectedBrowseRowIdAtom, rowId)
  set(browseSearchFocusNonceAtom, (current) => current + 1)
})

export const moveBrowseSelectionAtom = atom(null, (get, set, delta: number) => {
  const rows = get(visibleBrowseRowsAtom)
  const currentIndex = getIndexForRowId(rows, get(selectedBrowseRowIdAtom))
  const nextIndex = clampIndex(currentIndex + delta, rows.length)

  set(selectedBrowseRowIdAtom, rows[nextIndex]?.id ?? null)
  set(noticeAtom, null)
})

function getIndexForRowId(rows: readonly { id: string }[], rowId: string | null) {
  if (rows.length === 0) {
    return 0
  }

  const index = rowId ? rows.findIndex((row) => row.id === rowId) : -1

  return index >= 0 ? index : 0
}
