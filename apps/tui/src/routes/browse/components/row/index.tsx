import { ListRow } from '../../../../components/list-row'
import type { ListRowMeta, RowVariant } from '../../../../components/list-row/types'
import { theme } from '../../../../config/theme'
import type { HarbourRow } from '../../../../types/rows'

type BrowseRouteRowProps = {
  isHovered: boolean
  isSelected: boolean
  onRowClick: () => void
  onRowHover: (rowId: string | null) => void
  row: HarbourRow
  scopeBreadcrumb: string
  variant: RowVariant
}

export function BrowseRouteRow({
  isHovered,
  isSelected,
  onRowClick,
  onRowHover,
  row,
  scopeBreadcrumb,
  variant,
}: BrowseRouteRowProps) {
  const meta = getBrowseRowMeta(row, scopeBreadcrumb)
  const marker = row.isCurrent ? '◉' : row.isActive ? '●' : '○'
  const markerColor = row.isCurrent ? theme.active : row.isActive ? theme.accent : theme.idle

  return (
    <ListRow
      isHovered={isHovered}
      isSelected={isSelected}
      marker={marker}
      markerColor={markerColor}
      meta={meta}
      name={row.label}
      onRowClick={onRowClick}
      onRowHover={onRowHover}
      rowId={row.id}
      variant={variant}
    />
  )
}

function getBrowseRowMeta(row: HarbourRow, scopeBreadcrumb: string): ListRowMeta {
  if (row.kind === 'project') {
    return { sessions: row.activeSessionCount }
  }

  if (row.kind === 'workspace') {
    return {
      active: row.isActive,
      ...(row.branchName ? { branch: row.branchName } : {}),
      sessions: row.activeSessionCount,
    }
  }

  if (row.kind === 'module') {
    return {
      active: row.hasSession,
      breadcrumb: [scopeBreadcrumb, row.label].filter(Boolean).join(' › '),
    }
  }

  return {}
}
