import type { TuiServices, TuiStore } from '../../../app-context'

import { selectCurrentBrowseSection, selectIsBrowseActionsOpen, selectIsWorktreeFormOpen } from '../../../store'

export function handleBrowseRouteBack(services: TuiServices, store: TuiStore) {
  if (selectIsWorktreeFormOpen(store.getState())) {
    store.getState().backWorktreeForm()
    return
  }

  if (selectIsBrowseActionsOpen(store.getState())) {
    store.getState().closeActionsMenu()
    return
  }

  const query = store.getState().browse.list.query
  const currentSection = selectCurrentBrowseSection(store.getState())

  if (query.length > 0) {
    store.getState().resetBrowseQuery()
    store.getState().resetBrowseSelection()
    store.getState().clearNotice()
    return
  }

  if (currentSection === 'workspaces') {
    store.getState().resetProjectScope()
    return
  }

  if (currentSection === 'modules') {
    store.getState().resetWorkspaceScope()
    return
  }

  services.renderer.destroy()
}
