import type { ActiveActionRow } from '../../types/rows'
import { selectSelectedActiveRow } from '../active/active-selectors'
import { selectBrowseActionRows } from '../browse/browse-selectors'
import type { TuiStoreModel } from '../types'

export const activeActionIds = {
  closeRuntimeSession: 'active.close_runtime_session',
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
      : state.surfaces.surface.kind === 'actions'
        ? state.surfaces.actionsFocusTargetRef
        : state.surfaces.browserFocusTargetRef

  return ref?.current ?? null
}
