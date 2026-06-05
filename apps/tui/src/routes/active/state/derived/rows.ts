import { atom } from 'jotai'

import { currentRuntimeAtom } from '../../../../state/app'
import { activeRuntimeRowsAtom } from '../../../../state/rows'
import type { ActiveRuntimeRow } from '../../../../types/rows'
import { activeQueryAtom } from '../atoms'

export const visibleActiveRowsAtom = atom<readonly ActiveRuntimeRow[]>((get) => {
  const query = get(activeQueryAtom).trim().toLowerCase()
  const currentRuntime = get(currentRuntimeAtom)
  const rows = get(activeRuntimeRowsAtom).map((row) => ({
    ...row,
    isCurrent: currentRuntime?.sessionName === row.sessionName,
  }))

  if (!query) {
    return rows
  }

  return rows
    .map((row) => ({ row, score: row.label.toLowerCase().indexOf(query) }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => left.score - right.score)
    .map((entry) => entry.row)
})
