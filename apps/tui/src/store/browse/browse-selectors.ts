import type { RuntimeFact } from '@harbour/domain'

import type { HarbourRow, ActionRow, ModuleRow, ProjectRow, WorkspaceRow } from '../../types/rows'
import { browseActionIds } from './browse-action-ids'
import { getSelectedRow } from '../shared/list-selectors'
import type { TuiStoreModel } from '../types'
import { getBrowseSection, getSelectedProjectId, getSelectedWorkspaceId, isImplicitWorkspace } from './browse-state'

type SupportedContextRow = ModuleRow | ProjectRow | WorkspaceRow

export function selectCurrentBrowseSection(state: TuiStoreModel) {
  return getBrowseSection(state.browse.scope)
}

export function selectBrowseRows(state: TuiStoreModel): readonly HarbourRow[] {
  const section = selectCurrentBrowseSection(state)

  if (section === 'modules') {
    return state.data.moduleRows
  }

  if (section === 'workspaces') {
    return state.data.workspaceRows
  }

  return state.data.projectRows
}

export function selectVisibleBrowseRows(state: TuiStoreModel): readonly HarbourRow[] {
  const query = state.browse.list.query.trim().toLowerCase()
  const baseRows = selectBrowseRows(state).map((row) => ({
    ...row,
    isCurrent: isCurrentBrowseRow(row, state.app.currentRuntime),
  }))
  const scopedRows = state.browse.visibility === 'active' ? baseRows.filter((row) => row.isActive) : [...baseRows]

  if (!query) {
    return scopedRows
  }

  return scopedRows
    .map((row) => ({ row, score: getBrowseRowScore(row, query) }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => left.score - right.score)
    .map((entry) => entry.row)
}

export function selectSelectedBrowseRow(state: TuiStoreModel) {
  return getSelectedRow(selectVisibleBrowseRows(state), state.browse.list.selectedId)
}

export function selectHoveredBrowseRow(state: TuiStoreModel) {
  return getSelectedRow(selectVisibleBrowseRows(state), state.browse.list.hoveredId)
}

export function selectBrowseBreadcrumb(state: TuiStoreModel) {
  const projectId = getSelectedProjectId(state.browse.scope)
  const workspaceId = getSelectedWorkspaceId(state.browse.scope)
  const section = selectCurrentBrowseSection(state)
  const projectLabel = state.data.projectRows.find((row) => row.projectId === projectId)?.label
  const workspaceLabel = state.data.workspaceRows.find((row) => row.workspaceId === workspaceId)?.label

  if (section === 'modules' && projectLabel && workspaceLabel && !isImplicitWorkspace(state.browse.scope)) {
    return `${projectLabel} › ${workspaceLabel}`
  }

  if (section === 'modules' && projectLabel) {
    return projectLabel
  }

  if (section === 'workspaces' && projectLabel) {
    return projectLabel
  }

  return ''
}

export function selectSelectedProjectIssue(state: TuiStoreModel) {
  const projectId = getSelectedProjectId(state.browse.scope)

  if (!projectId) {
    return null
  }

  return state.data.projectRows.find((row) => row.projectId === projectId)?.projectIssue ?? null
}

export function selectBrowseActionRows(state: TuiStoreModel): readonly ActionRow[] {
  const target = getBrowseActionTarget(state)

  if (!target) {
    return []
  }

  return buildActionRows(target)
}

export function getBrowseActionTarget(state: TuiStoreModel): SupportedContextRow | null {
  const visibleRows = selectVisibleBrowseRows(state)
  const selectedRow = selectSelectedBrowseRow(state)
  const currentRow = visibleRows.find((row) => row.id === state.browse.list.selectedId)
  const section = selectCurrentBrowseSection(state)
  const projectId = getSelectedProjectId(state.browse.scope)
  const workspaceId = getSelectedWorkspaceId(state.browse.scope)

  if (currentRow && currentRow.kind !== 'action') {
    return currentRow
  }

  if (section === 'modules' && workspaceId && selectedRow?.kind === 'workspace') {
    return selectedRow
  }

  if (section === 'workspaces' && projectId && selectedRow?.kind === 'project') {
    return selectedRow
  }

  return null
}

function buildActionRows(target: SupportedContextRow): readonly ActionRow[] {
  if (target.kind === 'project') {
    return [makeActionRow(browseActionIds.openProjectRoot, 'Open', 'project runtime', target)]
  }

  if (target.kind === 'workspace') {
    return [
      makeActionRow(browseActionIds.openWorkspaceRoot, 'Open', 'workspace runtime', target),
      makeActionRow(browseActionIds.createWorkspace, 'Create workspace', 'git worktree', target),
      makeActionRow(browseActionIds.openProjectRoot, 'Open project root', 'project runtime', target),
    ]
  }

  return [
    makeActionRow(browseActionIds.openModuleSession, 'Open', 'module runtime', target),
    makeActionRow(browseActionIds.openWorkspaceRoot, 'Open workspace root', 'workspace runtime', target),
    makeActionRow(browseActionIds.openProjectRoot, 'Open project root', 'project runtime', target),
  ]
}

function makeActionRow(
  actionId: string,
  label: string,
  metadata: string,
  target: SupportedContextRow,
): ActionRow {
  return {
    id: `${actionId}:${target.id}`,
    kind: 'action',
    label,
    isActive: true,
    metadata,
    actionId,
    target: {
      projectId: target.projectId,
      ...(target.kind === 'project' ? {} : { workspaceId: target.workspaceId }),
      ...(target.kind === 'module' ? { moduleId: target.moduleId } : {}),
    },
  }
}

function getBrowseRowScore(row: HarbourRow, query: string) {
  const label = row.label.toLowerCase()
  const metadata = row.metadata?.toLowerCase() ?? ''
  const labelIndex = label.indexOf(query)

  if (labelIndex >= 0) {
    return labelIndex
  }

  const metadataIndex = metadata.indexOf(query)

  if (metadataIndex >= 0) {
    return 100 + metadataIndex
  }

  return -1
}

function isCurrentBrowseRow(row: HarbourRow, currentRuntime: RuntimeFact | null) {
  if (!currentRuntime) {
    return false
  }

  if (row.kind === 'project') {
    return currentRuntime.scope === 'project' && row.label === currentRuntime.projectName
  }

  if (row.kind === 'workspace') {
    return currentRuntime.scope === 'workspace' && row.label === currentRuntime.workspaceName
  }

  if (row.kind === 'module') {
    return currentRuntime.scope === 'module' && row.label === currentRuntime.moduleName
  }

  return false
}
