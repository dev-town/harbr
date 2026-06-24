import { getRepairedSelectedId, moveSelectedId } from '../shared/list-selectors'
import {
  selectSelectedActiveRow,
  selectVisibleActiveRows,
} from './active-selectors'
import {
  selectActiveActionRows,
  selectIsActionsOpen,
} from '../surfaces/surfaces-selectors'
import type { TuiStoreActions, TuiStoreGet, TuiStoreSet } from '../types'

export function createActiveActions(
  set: TuiStoreSet,
  get: TuiStoreGet,
): Pick<
  TuiStoreActions,
  | 'changeActiveQuery'
  | 'hoverActiveRow'
  | 'moveActiveSelection'
  | 'openActiveActionsMenu'
  | 'resetActiveQuery'
  | 'resetActiveSelection'
  | 'selectActiveRow'
> {
  return {
    changeActiveQuery: (value) => {
      set((state) => ({
        active: { list: { ...state.active.list, query: value } },
        app: { ...state.app, notice: null },
      }))

      const rows = selectVisibleActiveRows(get())
      const selectedId = getRepairedSelectedId(
        rows,
        get().active.list.selectedId,
      )
      set((state) => ({
        active: { list: { ...state.active.list, selectedId } },
      }))
    },
    hoverActiveRow: (rowId) =>
      set((state) => ({
        active: { list: { ...state.active.list, hoveredId: rowId } },
      })),
    moveActiveSelection: (delta) => {
      const rows = selectVisibleActiveRows(get())
      const selectedId = moveSelectedId(
        rows,
        get().active.list.selectedId,
        delta,
      )
      set((state) => ({
        active: { list: { ...state.active.list, selectedId } },
        app: { ...state.app, notice: null },
      }))
    },
    openActiveActionsMenu: () => {
      if (selectIsActionsOpen(get())) {
        return
      }

      if (
        selectActiveActionRows(get()).length === 0 ||
        !selectSelectedActiveRow(get())
      ) {
        get().setNotice('No actions for current context', 'warning')
        return
      }

      set((state) => ({
        app: { ...state.app, notice: null },
        surfaces: {
          ...state.surfaces,
          surface: { kind: 'actions', route: 'active' },
        },
      }))
    },
    resetActiveQuery: () =>
      set((state) => ({
        active: { list: { ...state.active.list, query: '' } },
      })),
    resetActiveSelection: () => {
      const selectedId = getRepairedSelectedId(
        selectVisibleActiveRows(get()),
        get().active.list.selectedId,
      )
      set((state) => ({
        active: { list: { ...state.active.list, hoveredId: null, selectedId } },
      }))
    },
    selectActiveRow: (rowId) =>
      set((state) => ({
        active: { list: { ...state.active.list, selectedId: rowId } },
        surfaces: {
          ...state.surfaces,
          focusRequestKey: state.surfaces.focusRequestKey + 1,
        },
      })),
  }
}
