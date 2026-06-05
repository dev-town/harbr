import { atom, type Getter, type Setter } from 'jotai'

import { noticeAtom } from '../../../../state/app'
import {
  browseQueryAtom,
  browseSearchFocusNonceAtom,
  browseVisibilityAtom,
  isActionsOpenAtom,
  selectedBrowseRowIdAtom,
} from '../atoms'
import { visibleBrowseRowsAtom } from '../derived'

export const focusBrowseSearchAtom = atom(null, (_get, set) => {
  set(browseSearchFocusNonceAtom, (current) => current + 1)
})

export const changeBrowseQueryAtom = atom(null, (get, set, value: string) => {
  set(browseQueryAtom, value)

  if (!get(isActionsOpenAtom)) {
    syncSelectedBrowseRowId(get, set)
  }

  set(noticeAtom, null)
})

export const toggleBrowseVisibilityAtom = atom(null, (get, set) => {
  set(browseVisibilityAtom, (current) => (current === 'active' ? 'all' : 'active'))
  syncSelectedBrowseRowId(get, set)
  set(noticeAtom, null)
})

function syncSelectedBrowseRowId(get: Getter, set: Setter) {
  const rows = get(visibleBrowseRowsAtom)
  const selectedRowId = get(selectedBrowseRowIdAtom)

  if (selectedRowId && rows.some((row) => row.id === selectedRowId)) {
    return
  }

  set(selectedBrowseRowIdAtom, rows[0]?.id ?? null)
}
