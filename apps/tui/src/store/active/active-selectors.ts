import { isSameRuntimeIdentity, type CurrentRuntime, type RuntimeAttachment } from '@harbr/domain'

import type { TuiStoreModel } from '~/store/types'
import type { HarbourRow } from '~/types/rows'
import { getSelectedRow } from '~/store/shared/list-selectors'
import { scoreSearch, searchTerms } from '~/store/shared/search'

export function selectVisibleActiveRows(
  state: TuiStoreModel,
): readonly (HarbourRow & { runtime: RuntimeAttachment })[] {
  const terms = searchTerms(state.active.list.query)
  const rows = state.data.activeRuntimeRows.filter(hasRuntime).map((row) => ({
    ...row,
    isCurrent: isCurrentActiveRow(row, state.app.currentRuntime),
  }))

  if (terms.length === 0) {
    return rows
  }

  return rows
    .map((row) => ({
      row,
      score: scoreSearch(terms, {
        label: row.label,
        context: row.target.breadcrumb,
        metadata: row.kind === 'project' ? '' : (row.branchName ?? ''),
      }),
    }))
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

function hasRuntime(row: HarbourRow): row is HarbourRow & { runtime: RuntimeAttachment } {
  return row.runtime !== null
}

function isCurrentActiveRow(
  row: HarbourRow & { runtime: RuntimeAttachment },
  currentRuntime: CurrentRuntime,
) {
  return currentRuntime
    ? isSameRuntimeIdentity(currentRuntime.identity, row.runtime.identity)
    : false
}
