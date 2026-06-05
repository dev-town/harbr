import { ListRow } from '../../../../components/list-row'
import { theme } from '../../../../config/theme'
import type { HarbourRow } from '../../../../types/rows'

type BrowseRouteRowProps = {
  isHovered: boolean
  isSelected: boolean
  onRowClick: () => void
  onRowHover: (rowId: string | null) => void
  row: HarbourRow
}

export function BrowseRouteRow({
  isHovered,
  isSelected,
  onRowClick,
  onRowHover,
  row,
}: BrowseRouteRowProps) {
  return (
    <ListRow
      context={row.metadata ?? row.kind}
      isHovered={isHovered}
      isSelected={isSelected}
      marker={row.isCurrent ? '●' : '○'}
      markerColor={row.isCurrent ? theme.active : theme.idle}
      name={row.label}
      nameWidth={32}
      onRowClick={onRowClick}
      onRowHover={onRowHover}
      rowId={row.id}
    />
  )
}
