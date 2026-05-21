import { useAtomValue } from 'jotai'
import { useEffect, useRef } from 'react'

import { handleRowClick, handleRowHover } from '../../actions'
import { useTuiContext } from '../../app-context'
import { theme } from '../../config/theme'
import { capitalize } from '../../helpers/labels'
import { currentSectionAtom, hoveredIndexAtom, loadingAtom, selectedIndexAtom, visibleRowsAtom } from '../../state'
import { RowLine } from '../row-line'
import { StatusLine } from '../status-line'

export function ResultsList() {
  const context = useTuiContext()
  const currentSection = useAtomValue(currentSectionAtom)
  const hoveredIndex = useAtomValue(hoveredIndexAtom)
  const isLoading = useAtomValue(loadingAtom)
  const rows = useAtomValue(visibleRowsAtom)
  const selectedIndex = useAtomValue(selectedIndexAtom)
  const scrollboxRef = useRef<{ scrollChildIntoView?: (childId: string) => void } | null>(null)

  useEffect(() => {
    const row = rows[selectedIndex]

    if (!row) {
      return
    }

    scrollboxRef.current?.scrollChildIntoView?.(`row:${row.id}`)
  }, [rows, selectedIndex])

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
      {isLoading ? <StatusLine color={theme.accent} icon="" text="Refreshing Harbour view..." /> : null}
      {!isLoading && rows.length === 0 ? (
        <StatusLine
          color={theme.muted}
          icon="󰮗"
          text={`No ${capitalize(currentSection).toLowerCase()} match current filters`}
        />
      ) : null}
      {!isLoading
        ? rows.map((row, index) => (
            <box id={`row:${row.id}`} key={row.id} width="100%">
              <RowLine
                hoveredIndex={hoveredIndex}
                index={index}
                isSelected={index === selectedIndex}
                onRowClick={(rowIndex) => handleRowClick(context, rowIndex)}
                onRowHover={(rowIndex) => handleRowHover(context, rowIndex)}
                row={row}
              />
            </box>
          ))
        : null}
    </scrollbox>
  )
}
