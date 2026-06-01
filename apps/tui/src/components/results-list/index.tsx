import type { ScrollBoxRenderable } from '@opentui/core'
import type { HarbourRow } from '@harbour/domain'
import { useEffect, useRef } from 'react'

import { theme } from '../../config/theme'
import { useBrowseList } from '../../hooks/useBrowseList'
import { capitalize } from '../../helpers/labels'
import { RowLine } from '../row-line'
import { StatusLine } from '../status-line'

type ResultsListProps = {
  emptyLabel?: string
  isLoading?: boolean
  onRowSelect: () => void
  rows: readonly HarbourRow[]
}

export function ResultsList({
  emptyLabel,
  isLoading: forceLoading = false,
  onRowSelect,
  rows,
}: ResultsListProps) {
  const { currentSection, hoveredId, isLoading, onHoverRow, onSelectRow, selectedId } =
    useBrowseList()
  const scrollboxRef = useRef<ScrollBoxRenderable | null>(null)
  const showLoading = forceLoading || isLoading

  useEffect(() => {
    if (!selectedId) {
      return
    }

    scrollboxRef.current?.scrollChildIntoView?.(`row:${selectedId}`)
  }, [selectedId])

  return (
    <scrollbox
      ref={scrollboxRef}
      style={{
        contentOptions: { backgroundColor: theme.panel },
        rootOptions: { backgroundColor: theme.panel },
        scrollbarOptions: {
          trackOptions: {
            backgroundColor: theme.panelSoft,
            foregroundColor: theme.selectionEdge,
          },
        },
        viewportOptions: { backgroundColor: theme.panel },
        wrapperOptions: { backgroundColor: theme.panel },
      }}
    >
      {showLoading ? <StatusLine color={theme.accent} icon="" text="Refreshing Harbour view..." /> : null}
      {!showLoading && rows.length === 0 ? (
        <StatusLine
          color={theme.muted}
          icon="󰮗"
          text={emptyLabel ?? `No ${capitalize(currentSection).toLowerCase()} match current filters`}
        />
      ) : null}
      {!showLoading
        ? rows.map((row) => (
            <box id={`row:${row.id}`} key={row.id} width="100%">
              <RowLine
                isHovered={hoveredId === row.id}
                isSelected={selectedId === row.id}
                onRowClick={() => {
                  onSelectRow(row.id)
                  onRowSelect()
                }}
                onRowHover={onHoverRow}
                row={row}
              />
            </box>
          ))
        : null}
    </scrollbox>
  )
}
