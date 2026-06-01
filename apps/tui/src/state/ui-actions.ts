import type {
  ActionRow,
  HarbourRow,
  HarbourSection,
  ModuleRow,
  ProjectRow,
  WorkspaceRow,
} from '@harbour/domain'
import { atom, type Getter, type Setter } from 'jotai'

import { actionIds } from '../actions/action-ids'
import { clampIndex } from '../helpers/selection'
import { visibleBrowseRowsAtom } from './derived'
import {
  browseQueryAtom,
  browseSearchFocusNonceAtom,
  browseVisibilityAtom,
  hoveredActionRowIdAtom,
  hoveredBrowseRowIdAtom,
  isActionsOpenAtom,
  noticeAtom,
  selectedActionRowIdAtom,
  selectedBrowseRowIdAtom,
} from './app'
import {
  currentSectionAtom,
  selectedProjectIdAtom,
  selectedWorkspaceIdAtom,
} from './navigation'
import { actionRowsAtom, projectRowsAtom, workspaceRowsAtom } from './rows'

type SupportedContextRow = ModuleRow | ProjectRow | WorkspaceRow

export const clearNoticeAtom = atom(null, (_get, set) => {
  set(noticeAtom, null)
})

export const focusBrowseSearchAtom = atom(null, (_get, set) => {
  set(browseSearchFocusNonceAtom, (current) => current + 1)
})

export const hoverBrowseRowAtom = atom(null, (_get, set, rowId: string | null) => {
  set(hoveredBrowseRowIdAtom, rowId)
})

export const selectBrowseRowAtom = atom(null, (_get, set, rowId: string) => {
  set(selectedBrowseRowIdAtom, rowId)
  set(browseSearchFocusNonceAtom, (current) => current + 1)
})

export const hoverActionRowAtom = atom(null, (_get, set, rowId: string | null) => {
  set(hoveredActionRowIdAtom, rowId)
  set(noticeAtom, null)
})

export const selectActionRowAtom = atom(null, (_get, set, rowId: string) => {
  set(selectedActionRowIdAtom, rowId)
  set(noticeAtom, null)
})

export const changeQueryAtom = atom(null, (get, set, value: string) => {
  set(browseQueryAtom, value)

  if (!get(isActionsOpenAtom)) {
    syncSelectedBrowseRowId(get, set)
  }

  set(noticeAtom, null)
})

export const moveBrowseSelectionAtom = atom(null, (get, set, delta: number) => {
  const rows = get(visibleBrowseRowsAtom)
  const currentIndex = getIndexForRowId(rows, get(selectedBrowseRowIdAtom))
  const nextIndex = clampIndex(currentIndex + delta, rows.length)

  set(selectedBrowseRowIdAtom, rows[nextIndex]?.id ?? null)
  set(noticeAtom, null)
})

export const moveActionSelectionAtom = atom(null, (get, set, delta: number) => {
  const rows = get(actionRowsAtom)
  const currentIndex = getIndexForRowId(rows, get(selectedActionRowIdAtom))
  const nextIndex = clampIndex(currentIndex + delta, rows.length)

  set(selectedActionRowIdAtom, rows[nextIndex]?.id ?? null)
  set(noticeAtom, null)
})

export const toggleBrowseVisibilityAtom = atom(null, (_get, set) => {
  set(browseVisibilityAtom, (current) => (current === 'active' ? 'all' : 'active'))
  syncSelectedBrowseRowId(_get, set)
  set(noticeAtom, null)
})

export const openActionsMenuAtom = atom(null, (get, set) => {
  if (get(isActionsOpenAtom)) {
    return
  }

  const target = getActionTarget(
    get(currentSectionAtom),
    get(visibleBrowseRowsAtom),
    get(selectedBrowseRowIdAtom),
    get(selectedProjectIdAtom),
    get(selectedWorkspaceIdAtom),
    get(projectRowsAtom),
    get(workspaceRowsAtom),
  )

  if (!target) {
    set(noticeAtom, 'No actions for current context')
    return
  }

  const rows = buildActionRows(target)

  set(actionRowsAtom, rows)
  set(isActionsOpenAtom, true)
  set(selectedActionRowIdAtom, rows[0]?.id ?? null)
  set(hoveredActionRowIdAtom, null)
  set(noticeAtom, null)
})

export const closeActionsMenuAtom = atom(null, (_get, set) => {
  set(actionRowsAtom, [])
  set(isActionsOpenAtom, false)
  set(selectedActionRowIdAtom, null)
  set(hoveredActionRowIdAtom, null)
  set(noticeAtom, null)
})

function buildActionRows(target: SupportedContextRow): readonly ActionRow[] {
  if (target.kind === 'project') {
    return [
      makeActionRow(
        actionIds.openProjectRoot,
        'Open project root',
        'project runtime',
        target,
      ),
    ]
  }

  if (target.kind === 'workspace') {
    return [
      makeActionRow(
        actionIds.openWorkspaceRoot,
        'Open workspace root',
        'workspace runtime',
        target,
      ),
      makeActionRow(
        actionIds.openProjectRoot,
        'Open project root',
        'project runtime',
        target,
      ),
    ]
  }

  return [
    makeActionRow(
      actionIds.openModuleSession,
      'Open module session',
      'module runtime',
      target,
    ),
    makeActionRow(
      actionIds.openWorkspaceRoot,
      'Open workspace root',
      'workspace runtime',
      target,
    ),
    makeActionRow(
      actionIds.openProjectRoot,
      'Open project root',
      'project runtime',
      target,
    ),
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
  projectRows: readonly ProjectRow[],
  workspaceRows: readonly WorkspaceRow[],
): SupportedContextRow | null {
  const selectedRow = visibleBrowseRows.find((row) => row.id === selectedRowId)

  if (selectedRow && selectedRow.kind !== 'action') {
    return selectedRow
  }

  if (currentSection === 'modules' && selectedWorkspaceId) {
    return workspaceRows.find((row) => row.workspaceId === selectedWorkspaceId) ?? null
  }

  if (currentSection === 'workspaces' && selectedProjectId) {
    return projectRows.find((row) => row.projectId === selectedProjectId) ?? null
  }

  return null
}

function getIndexForRowId(rows: readonly HarbourRow[], rowId: string | null) {
  if (rows.length === 0) {
    return 0
  }

  const index = rowId ? rows.findIndex((row) => row.id === rowId) : -1

  return index >= 0 ? index : 0
}

function syncSelectedBrowseRowId(
  get: Getter,
  set: Setter,
) {
  const rows = get(visibleBrowseRowsAtom)
  const selectedRowId = get(selectedBrowseRowIdAtom)

  if (selectedRowId && rows.some((row) => row.id === selectedRowId)) {
    return
  }

  set(selectedBrowseRowIdAtom, rows[0]?.id ?? null)
}
