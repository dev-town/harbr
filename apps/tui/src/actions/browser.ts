import type { TuiServices, TuiStore } from '../app-context'
import {
  browseQueryAtom,
  currentSectionAtom,
  selectedBrowseRowAtom,
  selectedProjectIdAtom,
  selectedWorkspaceImplicitAtom,
  workspaceRowsAtom,
} from '../state'
import {
  openDefaultWorkspaceModules,
  openModules,
  openWorkspaces,
} from './drilldown'
import {
  openModuleRuntime,
  openProjectRoot,
  openWorkspaceRoot,
} from './runtime'
import {
  clearNotice,
  resetProjectScope,
  resetSelection,
  resetWorkspaceScope,
} from './store'

export function handleBrowseBack(services: TuiServices, store: TuiStore) {
  const query = store.get(browseQueryAtom)
  const currentSection = store.get(currentSectionAtom)

  if (query.length > 0) {
    store.set(browseQueryAtom, '')
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
      store.set(currentSectionAtom, 'projects')
      store.set(workspaceRowsAtom, [])
      store.set(selectedProjectIdAtom, null)
    } else {
      store.set(currentSectionAtom, 'workspaces')
    }

    resetWorkspaceScope(store)
    return
  }

  services.renderer.destroy()
}

export function handleBrowseSelect(services: TuiServices, store: TuiStore) {
  const row = store.get(selectedBrowseRowAtom)

  if (!row) {
    return
  }

  if (row.kind === 'workspace') {
    if (row.hasModules) {
      void openModules(services, store, row.projectId, row.workspaceId)
      return
    }

    void openWorkspaceRoot(services, store, row)
    return
  }

  if (row.kind !== 'project') {
    if (row.kind === 'module') {
      void openModuleRuntime(services, store, row)
    }

    return
  }

  if (row.hasWorkspaces) {
    void openWorkspaces(services, store, row.projectId)
    return
  }

  if (row.hasModules) {
    void openDefaultWorkspaceModules(services, store, row.projectId)
    return
  }

  void openProjectRoot(services, store, row)
}
