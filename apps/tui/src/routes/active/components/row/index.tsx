import { ListRow } from '../../../../components/list-row'
import { theme } from '../../../../config/theme'
import type { ActiveRuntimeRow } from '../../../../types/rows'

type ActiveRouteRowProps = {
  isHovered: boolean
  isSelected: boolean
  onRowClick: () => void
  onRowHover: (rowId: string | null) => void
  row: ActiveRuntimeRow
}

export function ActiveRouteRow({
  isHovered,
  isSelected,
  onRowClick,
  onRowHover,
  row,
}: ActiveRouteRowProps) {
  return (
    <ListRow
      context={row.contextLabel}
      isHovered={isHovered}
      isSelected={isSelected}
      marker={row.isCurrent ? '●' : '○'}
      markerColor={row.isCurrent ? theme.active : theme.idle}
      name={row.label}
      nameWidth={28}
      onRowClick={onRowClick}
      onRowHover={onRowHover}
      rowId={row.id}
    />
  )
}
