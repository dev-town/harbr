import type { RuntimeFact } from '@harbour/domain'

import type { TuiStoreModel } from '../types'
import type { ActiveRuntimeRow } from '../../types/rows'
import { getSelectedRow } from '../shared/list-selectors'

export function selectVisibleActiveRows(state: TuiStoreModel): readonly ActiveRuntimeRow[] {
  const query = state.active.list.query.trim().toLowerCase()
  const rows = state.data.activeRuntimeRows.map((row) => ({
    ...row,
    isCurrent: isCurrentActiveRow(row, state.app.currentRuntime),
  }))

  if (!query) {
    return rows
  }

  return rows
    .map((row) => ({ row, score: row.label.toLowerCase().indexOf(query) }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => left.score - right.score)
    .map((entry) => entry.row)
}

export function selectSelectedActiveRow(state: TuiStoreModel) {
  return getSelectedRow(selectVisibleActiveRows(state), state.active.list.selectedId)
}

export function selectHoveredActiveRow(state: TuiStoreModel) {
  return getSelectedRow(selectVisibleActiveRows(state), state.active.list.hoveredId)
}

function isCurrentActiveRow(row: ActiveRuntimeRow, currentRuntime: RuntimeFact | null) {
  return currentRuntime?.sessionName === row.sessionName
}
