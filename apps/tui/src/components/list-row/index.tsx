import { theme } from '../../config/theme'
import { padCell, truncate } from '../shared/utils/text'

type ListRowProps = {
  context: string
  contextColor?: string
  contextWidth?: number
  isHovered: boolean
  isSelected: boolean
  marker: string
  markerColor: string
  name: string
  nameWidth: number
  onRowClick: () => void
  onRowHover: (rowId: string | null) => void
  rowId: string
}

export function ListRow({
  context,
  contextColor = theme.muted,
  contextWidth = 70,
  isHovered,
  isSelected,
  marker,
  markerColor,
  name,
  nameWidth,
  onRowClick,
  onRowHover,
  rowId,
}: ListRowProps) {
  const selectedColor = isSelected
    ? theme.selection
    : isHovered
      ? theme.panelSoft
      : theme.panel

  return (
    <box
      border
      borderColor={selectedColor}
      borderStyle="rounded"
      onMouseDown={onRowClick}
      onMouseOut={() => onRowHover(null)}
      onMouseOver={() => onRowHover(rowId)}
      paddingLeft={1}
      paddingRight={1}
      width="100%"
    >
      <text>
        <span fg={markerColor}>{marker}</span>
        <span fg={theme.text}> </span>
        <span fg={isSelected ? theme.activeText : theme.text}>
          {padCell(truncate(name, nameWidth), nameWidth)}
        </span>
        <span fg={theme.muted}>{padCell('', 2)}</span>
        <span fg={contextColor}>{truncate(context, contextWidth)}</span>
      </text>
    </box>
  )
}
