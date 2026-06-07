import type { ActiveActionRow } from '../../types/rows'
import { selectSelectedActiveRow } from '../active/active-selectors'
import { selectBrowseActionRows } from '../browse/browse-selectors'
import type { TuiStoreModel } from '../types'

export const activeActionIds = {
  closeRuntimeSession: 'active.close_runtime_session',
  createRuntimeWindows: 'active.create_runtime_windows',
  openRuntime: 'active.open_runtime',
} as const

export function selectIsActionsOpen(state: TuiStoreModel) {
  return state.surfaces.surface.kind === 'actions'
}

export function selectIsActiveActionsOpen(state: TuiStoreModel) {
  return (
    state.surfaces.surface.kind === 'actions' &&
    state.surfaces.surface.route === 'active'
  )
}

export function selectIsBrowseActionsOpen(state: TuiStoreModel) {
  return (
    state.surfaces.surface.kind === 'actions' &&
    state.surfaces.surface.route === 'browse'
  )
}

export function selectIsWorktreeFormOpen(state: TuiStoreModel) {
  return state.surfaces.surface.kind === 'worktree-form'
}

export function selectIsWindowPickerOpen(state: TuiStoreModel) {
  return state.surfaces.surface.kind === 'window-picker'
}

export function selectActiveActionRows(
  state: TuiStoreModel,
): readonly ActiveActionRow[] {
  const target = selectSelectedActiveRow(state)

  if (!target) {
    return []
  }

  return [
    {
      actionId: activeActionIds.openRuntime,
      id: `action.open:${target.id}`,
      kind: 'active-action',
      label: 'Open',
      target,
    },
    ...makeActiveWindowActionRows(state, target),
    {
      actionId: activeActionIds.closeRuntimeSession,
      ...(target.isCurrent
        ? { disabledNotice: 'Cannot close current session' }
        : {}),
      id: `action.close:${target.id}`,
      kind: 'active-action',
      label: 'Close session',
      target,
    },
  ]
}

function makeActiveWindowActionRows(
  state: TuiStoreModel,
  target: ActiveActionRow['target'],
): readonly ActiveActionRow[] {
  if (!hasProjectWindows(state, target.projectId)) {
    return []
  }

  return [
    {
      actionId: activeActionIds.createRuntimeWindows,
      id: `action.create_windows:${target.id}`,
      kind: 'active-action',
      label: `Create ${target.target.scope} windows`,
      target,
    },
  ]
}

function hasProjectWindows(state: TuiStoreModel, projectId: string) {
  return (
    (state.data.projectWindows.find((entry) => entry.projectId === projectId)
      ?.windows.length ?? 0) > 0
  )
}

export function selectCurrentActionRows(state: TuiStoreModel) {
  if (state.surfaces.surface.kind !== 'actions') {
    return []
  }

  return state.surfaces.surface.route === 'active'
    ? selectActiveActionRows(state)
    : selectBrowseActionRows(state)
}

export function selectActiveFocusTarget(state: TuiStoreModel) {
  const ref =
    state.surfaces.surface.kind === 'worktree-form'
      ? state.surfaces.worktreeFormFocusTargetRef
      : state.surfaces.surface.kind === 'window-picker'
        ? state.surfaces.windowPickerFocusTargetRef
        : state.surfaces.surface.kind === 'actions'
          ? state.surfaces.actionsFocusTargetRef
          : state.surfaces.browserFocusTargetRef

  return ref?.current ?? null
}
