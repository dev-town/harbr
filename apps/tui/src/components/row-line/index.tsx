import type { HarbourRow } from '@harbour/domain'

import { theme } from '../../config/theme'
import { padCell, padChip, truncate } from '../shared/utils/text'
import { getKindChip } from './utils/get-kind-chip'
import { getStatusChip } from './utils/get-status-chip'

type RowLineProps = {
  hoveredIndex: number | null
  index: number
  isSelected: boolean
  onRowClick: (index: number) => void
  onRowHover: (index: number | null) => void
  row: HarbourRow
}

export function RowLine({
  hoveredIndex,
  index,
  isSelected,
  onRowClick,
  onRowHover,
  row,
}: RowLineProps) {
  const status = getStatusChip(row)
  const kind = getKindChip(row)
  const label = truncate(row.label, 44)
  const isHovered = hoveredIndex === index
  const backgroundColor = isSelected
    ? theme.selection
    : isHovered
      ? theme.panelSoft
      : theme.panel

  return (
    <box
      onMouseDown={() => onRowClick(index)}
      onMouseOut={() => onRowHover(null)}
      onMouseOver={() => onRowHover(index)}
      paddingLeft={1}
      paddingRight={1}
      style={{ backgroundColor }}
      width="100%"
    >
      <text>
        <span fg={status.color}>{status.icon}</span>
        <span fg={theme.text}> </span>
        <span fg={isSelected ? '#f5f7ff' : theme.text}>{padCell(label, 44)}</span>
        <span fg={theme.muted}>{padCell('', 2)}</span>
        <strong fg={kind.color}>{padChip(kind.label, 12)}</strong>
        <span fg={theme.muted}> </span>
        <strong fg={status.color}>{padChip(status.label, 14)}</strong>
      </text>
    </box>
  )
}
