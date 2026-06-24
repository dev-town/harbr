import type { VisibilityFilter } from '../../types/navigation'
import { getRepairedSelectedId, moveSelectedId } from '../shared/list-selectors'
import { projectsScope, workspacesScope } from './browse-scope'
import { isImplicitWorkspace } from './browse-state'
import {
  selectBrowseActionRows,
  selectVisibleBrowseRows,
} from './browse-selectors'
import { selectIsActionsOpen } from '../surfaces/surfaces-selectors'
import type { TuiStoreActions, TuiStoreGet, TuiStoreSet } from '../types'

export function createBrowseActions(
  set: TuiStoreSet,
  get: TuiStoreGet,
): Pick<
  TuiStoreActions,
  | 'changeBrowseQuery'
  | 'hoverBrowseRow'
  | 'moveBrowseSelection'
  | 'openBrowseActionsMenu'
  | 'resetBrowseQuery'
  | 'resetBrowseSelection'
  | 'resetProjectScope'
  | 'resetWorkspaceScope'
  | 'selectBrowseRow'
  | 'setBrowseVisibility'
  | 'toggleBrowseVisibility'
> {
  return {
    changeBrowseQuery: (value) => {
      set((state) => ({
        app: { ...state.app, notice: null },
        browse: {
          ...state.browse,
          list: { ...state.browse.list, query: value },
        },
      }))

      if (!selectIsActionsOpen(get())) {
        get().resetBrowseSelection()
      }
    },
    hoverBrowseRow: (rowId) =>
      set((state) => ({
        browse: {
          ...state.browse,
          list: { ...state.browse.list, hoveredId: rowId },
        },
      })),
    moveBrowseSelection: (delta) => {
      const rows = selectVisibleBrowseRows(get())
      const selectedId = moveSelectedId(
        rows,
        get().browse.list.selectedId,
        delta,
      )
      set((state) => ({
        app: { ...state.app, notice: null },
        browse: { ...state.browse, list: { ...state.browse.list, selectedId } },
      }))
    },
    openBrowseActionsMenu: () => {
      if (selectIsActionsOpen(get())) {
        return
      }

      if (selectBrowseActionRows(get()).length === 0) {
        get().setNotice('No actions for current context', 'warning')
        return
      }

      set((state) => ({
        app: { ...state.app, notice: null },
        surfaces: {
          ...state.surfaces,
          surface: { kind: 'actions', route: 'browse' },
        },
      }))
    },
    resetBrowseQuery: () =>
      set((state) => ({
        browse: { ...state.browse, list: { ...state.browse.list, query: '' } },
      })),
    resetBrowseSelection: () => {
      const selectedId = getRepairedSelectedId(
        selectVisibleBrowseRows(get()),
        get().browse.list.selectedId,
      )
      set((state) => ({
        browse: {
          ...state.browse,
          list: { ...state.browse.list, hoveredId: null, selectedId },
        },
      }))
    },
    resetProjectScope: () => {
      set((state) => ({
        app: { ...state.app, notice: null },
        browse: { ...state.browse, scope: projectsScope() },
        data: { ...state.data, moduleRows: [], workspaceRows: [] },
      }))
      get().resetBrowseSelection()
    },
    resetWorkspaceScope: () => {
      const scope = get().browse.scope
      const nextScope =
        scope.level === 'modules' && isImplicitWorkspace(scope)
          ? projectsScope()
          : scope.level === 'modules'
            ? workspacesScope(scope.projectId)
            : scope

      set((state) => ({
        app: { ...state.app, notice: null },
        browse: { ...state.browse, scope: nextScope },
        data: { ...state.data, moduleRows: [] },
      }))
      get().resetBrowseSelection()
    },
    selectBrowseRow: (rowId) =>
      set((state) => ({
        browse: {
          ...state.browse,
          list: { ...state.browse.list, selectedId: rowId },
        },
        surfaces: {
          ...state.surfaces,
          focusRequestKey: state.surfaces.focusRequestKey + 1,
        },
      })),
    setBrowseVisibility: (visibility: VisibilityFilter) => {
      set((state) => ({ browse: { ...state.browse, visibility } }))
      get().resetBrowseSelection()
    },
    toggleBrowseVisibility: () => {
      get().setBrowseVisibility(
        get().browse.visibility === 'active' ? 'all' : 'active',
      )
      get().clearNotice()
    },
  }
}
