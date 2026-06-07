import type { RuntimeAttachment } from '@harbour/domain'

import { ListRow } from '../../../../components/list-row'
import type { RowVariant } from '../../../../components/list-row/types'
import { theme } from '../../../../config/theme'
import type { HarbourRow } from '../../../../types/rows'

type ActiveRouteRowProps = {
  isHovered: boolean
  isSelected: boolean
  onRowClick: () => void
  onRowHover: (rowId: string | null) => void
  row: HarbourRow & { runtime: RuntimeAttachment }
  variant: RowVariant
}

export function ActiveRouteRow({
  isHovered,
  isSelected,
  onRowClick,
  onRowHover,
  row,
  variant,
}: ActiveRouteRowProps) {
  return (
    <ListRow
      isHovered={isHovered}
      isSelected={isSelected}
      marker={row.isCurrent ? '●' : '○'}
      markerColor={row.isCurrent ? theme.active : theme.idle}
      meta={{ breadcrumb: row.target.breadcrumb }}
      name={row.label}
      onRowClick={onRowClick}
      onRowHover={onRowHover}
      rowId={row.id}
      variant={variant}
    />
  )
}
