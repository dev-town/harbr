import { atom, type Getter, type Setter } from 'jotai'

import { noticeAtom } from '../../../../state/app'
import { activeQueryAtom, activeSearchFocusNonceAtom, selectedActiveRowIdAtom } from '../atoms'
import { selectedActiveRowAtom, visibleActiveRowsAtom } from '../derived'

export const focusActiveSearchAtom = atom(null, (_get, set) => {
  set(activeSearchFocusNonceAtom, (current) => current + 1)
})

export const changeActiveQueryAtom = atom(null, (get, set, value: string) => {
  set(activeQueryAtom, value)
  syncSelectedActiveRowId(get, set)
  set(noticeAtom, null)
})

function syncSelectedActiveRowId(get: Getter, set: Setter) {
  const row = get(selectedActiveRowAtom)

  if (row) {
    return
  }

  const rows = get(visibleActiveRowsAtom)
  set(selectedActiveRowIdAtom, rows[0]?.id ?? null)
}
