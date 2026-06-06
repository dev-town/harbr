import type { TuiStoreModel } from '../types'
import { selectBrowseBreadcrumb, selectCurrentBrowseSection, selectVisibleBrowseRows } from '../browse/browse-selectors'
import { selectIsActionsOpen } from '../surfaces/surfaces-selectors'

export function selectEffectiveVisibility(state: TuiStoreModel) {
  if (selectIsActionsOpen(state) || state.app.currentRoute === 'active') {
    return 'all'
  }

  if (state.browse.visibility === 'all') {
    return 'all'
  }

  return selectVisibleBrowseRows(state).some((row) => row.isActive) ? 'active' : 'all'
}

export function selectFooterHints(state: TuiStoreModel) {
  if (selectIsActionsOpen(state)) {
    return [
      { key: '↑↓', label: 'move' },
      { key: 'Enter', label: 'run action' },
      { key: 'Esc', label: 'close' },
    ]
  }

  if (state.app.currentRoute === 'active') {
    return [
      { key: 'Enter', label: 'switch' },
      { key: 'Ctrl+A', label: 'actions' },
      { key: 'Tab', label: 'next tab' },
      { key: 'Shift+Tab', label: 'prev tab' },
      { key: 'Esc', label: state.active.list.query.length > 0 ? 'clear query' : 'close' },
    ]
  }

  if (state.browse.list.query.length > 0) {
    return [
      { key: 'Enter', label: 'drill next' },
      { key: 'Ctrl+A', label: 'actions' },
      { key: 'Ctrl+F', label: 'active/all' },
      { key: 'Esc', label: 'clear query' },
    ]
  }

  if (selectCurrentBrowseSection(state) === 'workspaces') {
    return [
      { key: 'Enter', label: 'drill next' },
      { key: 'Ctrl+A', label: 'actions' },
      { key: 'Ctrl+F', label: 'active/all' },
      { key: 'Esc', label: 'back' },
    ]
  }

  if (selectCurrentBrowseSection(state) === 'modules') {
    return [
      { key: 'Enter', label: 'attach/create' },
      { key: 'Ctrl+A', label: 'actions' },
      { key: 'Ctrl+F', label: 'active/all' },
      { key: 'Esc', label: 'back' },
    ]
  }

  return [
    { key: 'Enter', label: 'drill next' },
    { key: 'Ctrl+A', label: 'actions' },
    { key: 'Ctrl+F', label: 'active/all' },
    { key: 'Esc', label: 'close' },
  ]
}

export const selectBreadcrumb = selectBrowseBreadcrumb
