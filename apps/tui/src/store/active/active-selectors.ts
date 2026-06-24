import type { RuntimeAttachment, RuntimeFact } from '@harbr/domain'

import type { TuiStoreModel } from '../types'
import type { HarbourRow } from '../../types/rows'
import { getSelectedRow } from '../shared/list-selectors'

export function selectVisibleActiveRows(
  state: TuiStoreModel,
): readonly (HarbourRow & { runtime: RuntimeAttachment })[] {
  const query = state.active.list.query.trim().toLowerCase()
  const rows = state.data.activeRuntimeRows.filter(hasRuntime).map((row) => ({
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
  return getSelectedRow(
    selectVisibleActiveRows(state),
    state.active.list.selectedId,
  )
}

export function selectHoveredActiveRow(state: TuiStoreModel) {
  return getSelectedRow(
    selectVisibleActiveRows(state),
    state.active.list.hoveredId,
  )
}

function hasRuntime(
  row: HarbourRow,
): row is HarbourRow & { runtime: RuntimeAttachment } {
  return row.runtime !== null
}

function isCurrentActiveRow(
  row: HarbourRow & { runtime: RuntimeAttachment },
  currentRuntime: RuntimeFact | null,
) {
  return currentRuntime?.sessionName === row.runtime.sessionName
}
