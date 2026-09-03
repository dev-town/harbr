import type { ReactNode } from 'react'

import { theme } from '~/config/theme'
import { StatusLine } from '~/components/status-line'
import { useResultsLoading } from './hooks/use-results-loading'
import { useResultsScrollbox } from './hooks/use-results-scrollbox'
import { useSelectedRowVisibility } from './hooks/use-selected-row-visibility'

type ResultsListProps<TRow extends { id: string }> = {
  emptyLabel?: string
  hoveredId: string | null
  isLoading?: boolean
  renderRow: (row: TRow, state: { isHovered: boolean; isSelected: boolean }) => ReactNode
  rows: readonly TRow[]
  selectedId: string | null
}

export function ResultsList<TRow extends { id: string }>({
  emptyLabel,
  hoveredId,
  isLoading: forceLoading = false,
  renderRow,
  rows,
  selectedId,
}: ResultsListProps<TRow>) {
  const showLoading = useResultsLoading(forceLoading)
  const { scrollboxRef, setScrollboxRef } = useResultsScrollbox()
  useSelectedRowVisibility({
    rows,
    rowsVisible: !showLoading,
    scrollboxRef,
    selectedId,
  })

  return (
    <scrollbox
      ref={setScrollboxRef}
      style={{
        height: '100%',
        marginBottom: 2,
      }}
    >
      {showLoading ? (
        <StatusLine color={theme.accent} icon="" text="Refreshing Harbr view..." />
      ) : null}
      {!forceLoading && !showLoading && rows.length === 0 ? (
        <StatusLine
          color={theme.muted}
          icon="󰮗"
          text={emptyLabel ?? 'No rows match current filters'}
        />
      ) : null}
      {!showLoading
        ? rows.map((row) => (
            <box id={`row:${row.id}`} key={row.id} width="100%">
              {renderRow(row, {
                isHovered: hoveredId === row.id,
                isSelected: selectedId === row.id,
              })}
            </box>
          ))
        : null}
    </scrollbox>
  )
}
