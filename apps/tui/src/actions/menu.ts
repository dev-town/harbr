import type {
  ActionRow,
  HarbourSection,
  ModuleRow,
  ProjectRow,
  WorkspaceRow,
} from '@harbour/domain'

import type { TuiAppContext } from '../app-context'
import { clampIndex } from '../helpers/selection'
import {
  actionRowsAtom,
  actionsOpenAtom,
  actionSelectedIndexAtom,
  currentSectionAtom,
  moduleRowsAtom,
  noticeAtom,
  previousSelectedIndexAtom,
  projectRowsAtom,
  selectedIndexAtom,
  selectedProjectIdAtom,
  selectedWorkspaceIdAtom,
  visibleBrowseRowsAtom,
  workspaceRowsAtom,
} from '../state'
import {
  openModuleRuntime,
  openProjectRoot,
  openWorkspaceRoot,
} from './runtime'

const actionIds = {
  openModuleSession: 'action.open_module_session',
  openProjectRoot: 'action.open_project_root',
  openWorkspaceRoot: 'action.open_workspace_root',
} as const

type SupportedContextRow = ModuleRow | ProjectRow | WorkspaceRow

export function openActionsMenu(context: TuiAppContext) {
  if (context.store.get(actionsOpenAtom)) {
    return
  }

  const currentSection = context.store.get(currentSectionAtom)

  const target = getActionTarget(context, currentSection)

  if (!target) {
    context.store.set(noticeAtom, 'No actions for current context')
    return
  }

  context.store.set(actionRowsAtom, buildActionRows(target))
  context.store.set(
    previousSelectedIndexAtom,
    context.store.get(selectedIndexAtom),
  )
  context.store.set(actionsOpenAtom, true)
  context.store.set(actionSelectedIndexAtom, 0)
  context.store.set(noticeAtom, null)
}

export function moveActionSelection(context: TuiAppContext, delta: number) {
  const nextIndex = context.store.get(actionSelectedIndexAtom) + delta
  context.store.set(
    actionSelectedIndexAtom,
    clampIndex(nextIndex, context.store.get(actionRowsAtom).length),
  )
  context.store.set(noticeAtom, null)
}

export function closeActionsMenu(context: TuiAppContext) {
  context.store.set(actionRowsAtom, [])
  context.store.set(actionsOpenAtom, false)
  context.store.set(actionSelectedIndexAtom, 0)
  context.store.set(noticeAtom, null)
  context.store.set(
    selectedIndexAtom,
    context.store.get(previousSelectedIndexAtom),
  )
}

export function handleActionSelect(context: TuiAppContext) {
  const row =
    context.store.get(actionRowsAtom)[
      context.store.get(actionSelectedIndexAtom)
    ]

  if (!row || row.kind !== 'action') {
    return
  }

  const target = resolveActionTarget(context, row)

  if (!target) {
    context.store.set(noticeAtom, 'Action target missing')
    return
  }

  switch (row.actionId) {
    case actionIds.openProjectRoot:
      {
        const project = getProjectRow(context, target.projectId)

        if (!project) {
          context.store.set(noticeAtom, 'Project context missing')
          return
        }

        void openProjectRoot(context, project)
      }
      return
    case actionIds.openWorkspaceRoot:
      if (target.kind !== 'workspace' && target.kind !== 'module') {
        context.store.set(noticeAtom, 'Workspace context missing')
        return
      }

      {
        const workspace =
          target.kind === 'workspace'
            ? target
            : getWorkspaceRow(context, target.workspaceId)

        if (!workspace) {
          context.store.set(noticeAtom, 'Workspace context missing')
          return
        }

        void openWorkspaceRoot(context, workspace)
      }
      return
    case actionIds.openModuleSession:
      if (target.kind !== 'module') {
        context.store.set(noticeAtom, 'Module context missing')
        return
      }

      void openModuleRuntime(context, target)
      return
  }
}

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
  context: TuiAppContext,
  currentSection: HarbourSection,
): SupportedContextRow | null {
  const selectedRow = context.store.get(visibleBrowseRowsAtom)[
    context.store.get(selectedIndexAtom)
  ]

  if (selectedRow && selectedRow.kind !== 'action') {
    return selectedRow
  }

  const selectedProjectId = context.store.get(selectedProjectIdAtom)
  const selectedWorkspaceId = context.store.get(selectedWorkspaceIdAtom)

  if (currentSection === 'modules' && selectedWorkspaceId) {
    return getWorkspaceRow(context, selectedWorkspaceId)
  }

  if (currentSection === 'workspaces' && selectedProjectId) {
    return getProjectRow(context, selectedProjectId)
  }

  return null
}

function resolveActionTarget(
  context: TuiAppContext,
  row: ActionRow,
): SupportedContextRow | null {
  if (row.target.moduleId) {
    return (
      context.store
        .get(moduleRowsAtom)
        .find((item) => item.moduleId === row.target.moduleId) ?? null
    )
  }

  if (row.target.workspaceId) {
    return getWorkspaceRow(context, row.target.workspaceId)
  }

  return row.target.projectId
    ? getProjectRow(context, row.target.projectId)
    : null
}

function getProjectRow(context: TuiAppContext, projectId: string) {
  return (
    context.store
      .get(projectRowsAtom)
      .find((row) => row.projectId === projectId) ?? null
  )
}

function getWorkspaceRow(context: TuiAppContext, workspaceId: string) {
  return (
    context.store
      .get(workspaceRowsAtom)
      .find((row) => row.workspaceId === workspaceId) ?? null
  )
}
