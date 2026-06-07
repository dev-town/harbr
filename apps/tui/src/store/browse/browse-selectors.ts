import type { RuntimeFact } from '@harbour/domain'

import type {
  HarbourRow,
  ActionRow,
  ActiveRuntimeRow,
  ModuleRow,
  ProjectRow,
  WorkspaceRow,
} from '../../types/rows'
import { browseActionIds } from './browse-action-ids'
import { getSelectedRow } from '../shared/list-selectors'
import type { TuiStoreModel } from '../types'
import {
  getBrowseSection,
  getSelectedProjectId,
  getSelectedWorkspaceId,
  isImplicitWorkspace,
} from './browse-state'

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

export function selectVisibleBrowseRows(
  state: TuiStoreModel,
): readonly HarbourRow[] {
  const query = state.browse.list.query.trim().toLowerCase()
  const baseRows = selectBrowseRows(state).map((row) => ({
    ...row,
    isCurrent: isCurrentBrowseRow(row, state.app.currentRuntime),
  }))
  const scopedRows =
    state.browse.visibility === 'active'
      ? baseRows.filter((row) => row.isActive)
      : [...baseRows]

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
  return getSelectedRow(
    selectVisibleBrowseRows(state),
    state.browse.list.selectedId,
  )
}

export function selectHoveredBrowseRow(state: TuiStoreModel) {
  return getSelectedRow(
    selectVisibleBrowseRows(state),
    state.browse.list.hoveredId,
  )
}

export function selectBrowseBreadcrumb(state: TuiStoreModel) {
  const projectId = getSelectedProjectId(state.browse.scope)
  const workspaceId = getSelectedWorkspaceId(state.browse.scope)
  const section = selectCurrentBrowseSection(state)
  const projectLabel = state.data.projectRows.find(
    (row) => row.projectId === projectId,
  )?.label
  const workspaceLabel = state.data.workspaceRows.find(
    (row) => row.workspaceId === workspaceId,
  )?.label

  if (
    section === 'modules' &&
    projectLabel &&
    workspaceLabel &&
    !isImplicitWorkspace(state.browse.scope)
  ) {
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

  return (
    state.data.projectRows.find((row) => row.projectId === projectId)
      ?.projectIssue ?? null
  )
}

export function selectBrowseActionRows(
  state: TuiStoreModel,
): readonly ActionRow[] {
  const target = getBrowseActionTarget(state)

  if (!target) {
    return []
  }

  return buildActionRows(state, target)
}

export function getBrowseActionTarget(
  state: TuiStoreModel,
): SupportedContextRow | null {
  const visibleRows = selectVisibleBrowseRows(state)
  const selectedRow = selectSelectedBrowseRow(state)
  const currentRow = visibleRows.find(
    (row) => row.id === state.browse.list.selectedId,
  )
  const section = selectCurrentBrowseSection(state)
  const projectId = getSelectedProjectId(state.browse.scope)
  const workspaceId = getSelectedWorkspaceId(state.browse.scope)

  if (currentRow && currentRow.kind !== 'action') {
    return currentRow
  }

  if (
    section === 'modules' &&
    workspaceId &&
    selectedRow?.kind === 'workspace'
  ) {
    return selectedRow
  }

  if (
    section === 'workspaces' &&
    projectId &&
    selectedRow?.kind === 'project'
  ) {
    return selectedRow
  }

  return null
}

function buildActionRows(
  state: TuiStoreModel,
  target: SupportedContextRow,
): readonly ActionRow[] {
  const closeAction = makeCloseSessionActionRow(state, target)

  if (target.kind === 'project') {
    return [
      makeActionRow(
        browseActionIds.openProjectRoot,
        `${getRuntimeVerbForContext(state, { projectId: target.projectId })} project`,
        'project runtime',
        target,
      ),
      ...makeWindowActionRows(state, target, 'project'),
      ...closeAction,
    ]
  }

  if (target.kind === 'workspace') {
    const project = getProjectRow(state, target.projectId)

    return [
      makeActionRow(
        browseActionIds.openWorkspaceRoot,
        `${getRuntimeVerbForContext(state, {
          projectId: target.projectId,
          workspaceId: target.workspaceId,
        })} workspace`,
        'workspace runtime',
        target,
      ),
      ...makeWindowActionRows(state, target, 'workspace'),
      makeActionRow(
        browseActionIds.createWorkspace,
        'New workspace',
        'git worktree',
        target,
      ),
      makeActionRow(
        browseActionIds.openProjectRoot,
        `${getRuntimeVerbForContext(state, { projectId: target.projectId })} project root`,
        'project runtime',
        target,
        undefined,
        project ? { projectId: project.projectId } : undefined,
      ),
      ...(project ? makeWindowActionRows(state, project, 'project') : []),
      ...closeAction,
    ]
  }

  const workspace = getWorkspaceRow(state, target.workspaceId)
  const project = getProjectRow(state, target.projectId)

  return [
    makeActionRow(
      browseActionIds.openModuleSession,
      `${getRuntimeVerbForContext(state, {
        projectId: target.projectId,
        workspaceId: target.workspaceId,
        moduleId: target.moduleId,
      })} module`,
      'module runtime',
      target,
    ),
    ...makeWindowActionRows(state, target, 'module'),
    makeActionRow(
      browseActionIds.openWorkspaceRoot,
      `${getRuntimeVerbForContext(state, {
        projectId: target.projectId,
        workspaceId: target.workspaceId,
      })} workspace root`,
      'workspace runtime',
      target,
      undefined,
      workspace
        ? { projectId: workspace.projectId, workspaceId: workspace.workspaceId }
        : undefined,
    ),
    ...(workspace ? makeWindowActionRows(state, workspace, 'workspace') : []),
    makeActionRow(
      browseActionIds.openProjectRoot,
      `${getRuntimeVerbForContext(state, { projectId: target.projectId })} project root`,
      'project runtime',
      target,
      undefined,
      project ? { projectId: project.projectId } : undefined,
    ),
    ...(project ? makeWindowActionRows(state, project, 'project') : []),
    ...closeAction,
  ]
}

function makeWindowActionRows(
  state: TuiStoreModel,
  target: SupportedContextRow,
  scope: 'module' | 'project' | 'workspace',
): readonly ActionRow[] {
  if (!hasProjectWindows(state, target.projectId)) {
    return []
  }

  const actionId =
    scope === 'module'
      ? browseActionIds.createModuleWindows
      : scope === 'workspace'
        ? browseActionIds.createWorkspaceWindows
        : browseActionIds.createProjectWindows

  return [
    makeActionRow(
      actionId,
      `Create ${scope} windows`,
      'configured windows',
      target,
      undefined,
      getContextForScope(target, scope),
    ),
  ]
}

function makeCloseSessionActionRow(
  state: TuiStoreModel,
  target: SupportedContextRow,
): readonly ActionRow[] {
  if (!target.isActive) {
    return []
  }

  const runtime = getExactActiveRuntime(state, target)

  if (!runtime) {
    return []
  }

  return [
    makeActionRow(
      browseActionIds.closeRuntimeSession,
      'Close session',
      'tmux runtime',
      target,
      isCurrentActiveRuntime(state, runtime)
        ? 'Cannot close current session'
        : undefined,
    ),
  ]
}

function isCurrentActiveRuntime(
  state: TuiStoreModel,
  runtime: ActiveRuntimeRow,
) {
  return state.app.currentRuntime?.sessionName === runtime.sessionName
}

function getExactActiveRuntime(
  state: TuiStoreModel,
  target: SupportedContextRow,
): ActiveRuntimeRow | null {
  if (target.kind === 'project') {
    return (
      state.data.activeRuntimeRows.find(
        (row) => row.scope === 'project' && row.projectId === target.projectId,
      ) ?? null
    )
  }

  if (target.kind === 'workspace') {
    return (
      state.data.activeRuntimeRows.find(
        (row) =>
          row.scope === 'workspace' && row.workspaceId === target.workspaceId,
      ) ?? null
    )
  }

  return (
    state.data.activeRuntimeRows.find(
      (row) => row.scope === 'module' && row.moduleId === target.moduleId,
    ) ?? null
  )
}

function makeActionRow(
  actionId: string,
  label: string,
  metadata: string,
  target: SupportedContextRow,
  disabledNotice?: string,
  targetContext = getContextForTarget(target),
): ActionRow {
  return {
    id: `${actionId}:${formatContextId(targetContext)}`,
    kind: 'action',
    label,
    isActive: true,
    metadata,
    actionId,
    ...(disabledNotice ? { disabledNotice } : {}),
    target: targetContext,
  }
}

function getContextForTarget(target: SupportedContextRow) {
  return {
    projectId: target.projectId,
    ...(target.kind === 'project' ? {} : { workspaceId: target.workspaceId }),
    ...(target.kind === 'module' ? { moduleId: target.moduleId } : {}),
  }
}

function getContextForScope(
  target: SupportedContextRow,
  scope: 'module' | 'project' | 'workspace',
) {
  if (scope === 'project' || target.kind === 'project') {
    return { projectId: target.projectId }
  }

  if (scope === 'workspace' || target.kind === 'workspace') {
    return { projectId: target.projectId, workspaceId: target.workspaceId }
  }

  return {
    projectId: target.projectId,
    workspaceId: target.workspaceId,
    moduleId: target.moduleId,
  }
}

function getRuntimeVerbForContext(
  state: TuiStoreModel,
  context: ActionRow['target'],
) {
  const runtimeExists = state.data.activeRuntimeRows.some((runtime) => {
    if (context.moduleId) {
      return runtime.scope === 'module' && runtime.moduleId === context.moduleId
    }

    if (context.workspaceId) {
      return (
        runtime.scope === 'workspace' &&
        runtime.workspaceId === context.workspaceId
      )
    }

    return runtime.scope === 'project' && runtime.projectId === context.projectId
  })

  return runtimeExists ? 'Open' : 'Start'
}

function formatContextId(context: ActionRow['target']) {
  return [context.projectId, context.workspaceId, context.moduleId]
    .filter(Boolean)
    .join(':')
}

function hasProjectWindows(state: TuiStoreModel, projectId: string) {
  return (
    state.data.projectWindows.find((entry) => entry.projectId === projectId)
      ?.windows.length ?? 0
  ) > 0
}

function getProjectRow(state: TuiStoreModel, projectId: string) {
  return state.data.projectRows.find((row) => row.projectId === projectId) ?? null
}

function getWorkspaceRow(state: TuiStoreModel, workspaceId: string) {
  return (
    state.data.workspaceRows.find((row) => row.workspaceId === workspaceId) ??
    null
  )
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

function isCurrentBrowseRow(
  row: HarbourRow,
  currentRuntime: RuntimeFact | null,
) {
  if (!currentRuntime) {
    return false
  }

  if (row.kind === 'project') {
    return (
      currentRuntime.scope === 'project' &&
      row.label === currentRuntime.projectName
    )
  }

  if (row.kind === 'workspace') {
    return (
      currentRuntime.scope === 'workspace' &&
      row.label === currentRuntime.workspaceName
    )
  }

  if (row.kind === 'module') {
    return (
      currentRuntime.scope === 'module' &&
      row.label === currentRuntime.moduleName
    )
  }

  return false
}
