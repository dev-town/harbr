import { ListRow } from '~/components/list-row'
import type { ListRowMeta, RowVariant } from '~/components/list-row/types'
import { theme } from '~/config/theme'
import { formatWorkspaceProvider } from '~/helpers/workspace-provider'
import type { HarbourRow } from '~/types/rows'

type BrowseRouteRowProps = {
  isHovered: boolean
  isSelected: boolean
  onRowClick: () => void
  onRowHover: (rowId: string | null) => void
  row: HarbourRow
  scopeBreadcrumb: string
  showWorkspaceProviderColumn: boolean
  variant: RowVariant
}

export function BrowseRouteRow({
  isHovered,
  isSelected,
  onRowClick,
  onRowHover,
  row,
  scopeBreadcrumb,
  showWorkspaceProviderColumn,
  variant,
}: BrowseRouteRowProps) {
  const meta = getBrowseRowMeta(row, scopeBreadcrumb)
  const marker = row.isCurrent ? '◉' : row.isActive ? '●' : '○'
  const markerColor = row.isCurrent
    ? theme.active
    : row.isActive
      ? theme.accent
      : theme.idle
  const workspaceProvider = getWorkspaceProviderLabel(row)

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
      showWorkspaceProviderColumn={showWorkspaceProviderColumn}
      variant={variant}
      {...(workspaceProvider ? { workspaceProvider } : {})}
    />
  )
}

function getBrowseRowMeta(row: HarbourRow, scopeBreadcrumb: string): ListRowMeta {
  if (row.kind === 'project') {
    return {
      sessions: row.activeSessionCount,
      ...(row.projectIssue ? { notice: { level: 'warning', message: row.projectIssue } } : {}),
    }
  }

  if (row.kind === 'workspace') {
    const distinctBranchName =
      row.branchName && row.branchName !== row.label ? row.branchName : null

    return {
      active: row.isActive,
      detached: !row.isDefault && !row.branchName,
      ...(distinctBranchName ? { branch: distinctBranchName } : {}),
      sessions: row.activeSessionCount,
    }
  }

  if (row.kind === 'module') {
    return {
      active: row.hasSession,
      breadcrumb: scopeBreadcrumb,
    }
  }

  return {}
}

function getWorkspaceProviderLabel(row: HarbourRow) {
  return row.kind !== 'project' && row.workspaceProvider
    ? formatWorkspaceProvider(row.workspaceProvider)
    : undefined
}
