import { atom } from 'jotai'

import { actionIds } from '../../../../actions/action-ids'
import { noticeAtom } from '../../../../state/app'
import type { HarbourSection } from '../../../../types/navigation'
import type { ActionRow, HarbourRow, ModuleRow, ProjectRow, WorkspaceRow } from '../../../../types/rows'
import {
  actionRowsAtom,
  isActionsOpenAtom,
  selectedBrowseRowIdAtom,
  selectedProjectIdAtom,
  selectedWorkspaceIdAtom,
} from '../atoms'
import { currentBrowseSectionAtom, selectedBrowseRowAtom, visibleBrowseRowsAtom } from '../derived'

type SupportedContextRow = ModuleRow | ProjectRow | WorkspaceRow

export const openActionsMenuAtom = atom(null, (get, set) => {
  if (get(isActionsOpenAtom)) {
    return
  }

  const target = getActionTarget(
    get(currentBrowseSectionAtom),
    get(visibleBrowseRowsAtom),
    get(selectedBrowseRowIdAtom),
    get(selectedProjectIdAtom),
    get(selectedWorkspaceIdAtom),
    get(selectedBrowseRowAtom),
  )

  if (!target) {
    set(noticeAtom, 'No actions for current context')
    return
  }

  const rows = buildActionRows(target)

  set(actionRowsAtom, rows)
  set(isActionsOpenAtom, true)
  set(noticeAtom, null)
})

export const closeActionsMenuAtom = atom(null, (_get, set) => {
  set(actionRowsAtom, [])
  set(isActionsOpenAtom, false)
  set(noticeAtom, null)
})

function buildActionRows(target: SupportedContextRow): readonly ActionRow[] {
  if (target.kind === 'project') {
    return [makeActionRow(actionIds.openProjectRoot, 'Open', 'project runtime', target)]
  }

  if (target.kind === 'workspace') {
    return [
      makeActionRow(actionIds.openWorkspaceRoot, 'Open', 'workspace runtime', target),
      makeActionRow(actionIds.createWorkspace, 'Create workspace', 'git worktree', target),
      makeActionRow(actionIds.openProjectRoot, 'Open project root', 'project runtime', target),
    ]
  }

  return [
    makeActionRow(actionIds.openModuleSession, 'Open', 'module runtime', target),
    makeActionRow(actionIds.openWorkspaceRoot, 'Open workspace root', 'workspace runtime', target),
    makeActionRow(actionIds.openProjectRoot, 'Open project root', 'project runtime', target),
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

function getActionTarget(
  currentSection: HarbourSection,
  visibleBrowseRows: readonly HarbourRow[],
  selectedRowId: string | null,
  selectedProjectId: string | null,
  selectedWorkspaceId: string | null,
  selectedRow: HarbourRow | null,
): SupportedContextRow | null {
  const currentRow = visibleBrowseRows.find((row) => row.id === selectedRowId)

  if (currentRow && currentRow.kind !== 'action') {
    return currentRow
  }

  if (currentSection === 'modules' && selectedWorkspaceId && selectedRow?.kind === 'workspace') {
    return selectedRow
  }

  if (currentSection === 'workspaces' && selectedProjectId && selectedRow?.kind === 'project') {
    return selectedRow
  }

  return null
}
