import type { RuntimeAttachment } from '@harbr/domain'

import { ListRow } from '~/components/list-row'
import type { RowVariant } from '~/components/list-row/types'
import { theme } from '~/config/theme'
import { formatWorkspaceProvider } from '~/helpers/workspace-provider'
import type { HarbourRow } from '~/types/rows'

type ActiveRouteRowProps = {
  isHovered: boolean
  isSelected: boolean
  onRowClick: () => void
  onRowHover: (rowId: string | null) => void
  row: HarbourRow & { runtime: RuntimeAttachment }
  showWorkspaceProviderColumn: boolean
  variant: RowVariant
}

export function ActiveRouteRow({
  isHovered,
  isSelected,
  onRowClick,
  onRowHover,
  row,
  showWorkspaceProviderColumn,
  variant,
}: ActiveRouteRowProps) {
  const workspaceProviderLabel = getWorkspaceProviderLabel(row)

  return (
    <ListRow
      isHovered={isHovered}
      isSelected={isSelected}
      marker={row.isCurrent ? '●' : '○'}
      markerColor={row.isCurrent ? theme.active : theme.idle}
      meta={getActiveRowMeta(row)}
      name={row.label}
      onRowClick={onRowClick}
      onRowHover={onRowHover}
      rowId={row.id}
      showWorkspaceProviderColumn={showWorkspaceProviderColumn}
      variant={variant}
      {...(workspaceProviderLabel ? { workspaceProvider: workspaceProviderLabel } : {})}
    />
  )
}

function getActiveRowMeta(row: HarbourRow & { runtime: RuntimeAttachment }) {
  if (row.kind === 'project') {
    return {}
  }

  const { projectName, workspaceName } = row.target.runtimeTarget
  const breadcrumb =
    row.kind === 'workspace'
      ? projectName
      : [projectName, workspaceName].filter(Boolean).join(' › ')
  const distinctBranchName = row.branchName && row.branchName !== row.label ? row.branchName : null

  return {
    breadcrumb,
    ...(distinctBranchName ? { branch: distinctBranchName } : {}),
    ...(!row.branchName ? { detached: true } : {}),
  }
}

function getWorkspaceProviderLabel(row: HarbourRow & { runtime: RuntimeAttachment }) {
  return row.kind !== 'project' && row.workspaceProvider
    ? formatWorkspaceProvider(row.workspaceProvider)
    : undefined
}
