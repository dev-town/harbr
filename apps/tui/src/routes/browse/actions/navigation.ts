import type { TuiServices, TuiStore } from '../../../app-context'

import { clearNotice, resetProjectScope, resetQuery, resetSelection, resetWorkspaceScope } from '../../../actions/store'
import {
  browseQueryAtom,
  browseSectionAtom,
  isActionsOpenAtom,
  isWorktreeFormOpenAtom,
  selectedProjectIdAtom,
  selectedWorkspaceImplicitAtom,
} from '../state/atoms'
import { backWorktreeFormAtom, closeActionsMenuAtom } from '../state/actions'

export function handleBrowseRouteBack(services: TuiServices, store: TuiStore) {
  if (store.get(isWorktreeFormOpenAtom)) {
    store.set(backWorktreeFormAtom)
    return
  }

  if (store.get(isActionsOpenAtom)) {
    store.set(closeActionsMenuAtom)
    return
  }

  const query = store.get(browseQueryAtom)
  const currentSection = store.get(browseSectionAtom)

  if (query.length > 0) {
    resetQuery(store)
    resetSelection(store)
    clearNotice(store)
    return
  }

  if (currentSection === 'workspaces') {
    resetProjectScope(store)
    return
  }

  if (currentSection === 'modules') {
    if (store.get(selectedWorkspaceImplicitAtom)) {
      store.set(browseSectionAtom, 'projects')
      store.set(selectedProjectIdAtom, null)
    } else {
      store.set(browseSectionAtom, 'workspaces')
    }

    resetWorkspaceScope(store)
    return
  }

  services.renderer.destroy()
}
