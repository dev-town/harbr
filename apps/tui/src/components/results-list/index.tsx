import type { ScrollBoxRenderable } from '@opentui/core'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { theme } from '~/config/theme'
import { StatusLine } from '~/components/status-line'

type ResultsListProps<TRow extends { id: string }> = {
  emptyLabel?: string
  hoveredId: string | null
  isLoading?: boolean
  renderRow: (
    row: TRow,
    state: { isHovered: boolean; isSelected: boolean },
  ) => ReactNode
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
  const scrollboxRef = useRef<ScrollBoxRenderable | null>(null)
  const [showLoading, setShowLoading] = useState(false)
  const setScrollboxRef = useCallback(
    (scrollbox: ScrollBoxRenderable | null) => {
      scrollboxRef.current = scrollbox

      if (!scrollbox) {
        return
      }

      // OpenTUI measures a new scrollbox with a zero-height viewport, which
      // makes its automatic scrollbar visible for one frame. Keep it hidden
      // until the deferred layout recalculation has the real viewport size.
      scrollbox.verticalScrollBar.visible = false
      process.nextTick(() => {
        if (scrollboxRef.current === scrollbox) {
          scrollbox.verticalScrollBar.resetVisibilityControl()
        }
      })
    },
    [],
  )

  useEffect(() => {
    if (!forceLoading) {
      setShowLoading(false)
      return
    }

    const timeout = setTimeout(() => {
      setShowLoading(true)
    }, 500)

    return () => {
      clearTimeout(timeout)
    }
  }, [forceLoading])

  useEffect(() => {
    if (!selectedId) {
      return
    }

    scrollboxRef.current?.scrollChildIntoView?.(`row:${selectedId}`)
  }, [selectedId])

  return (
    <scrollbox
      ref={setScrollboxRef}
      style={{
        height: '100%',
        marginBottom: 2,
      }}
    >
      {showLoading ? (
        <StatusLine
          color={theme.accent}
          icon=""
          text="Refreshing Harbr view..."
        />
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
