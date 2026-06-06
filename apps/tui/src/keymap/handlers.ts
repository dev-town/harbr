import { harbourCommandIds, type HarbourCommandId } from './commands'

import type { TuiServices, TuiStore } from '../app-context'
import {
  handleActiveRouteBack,
  handleActiveRouteSelect,
} from '../routes/active'
import {
  handleBrowseRouteBack,
  handleBrowseRouteSelect,
} from '../routes/browse'
import { loadProjects } from '../actions/refresh'
import { handleWorktreeFormSubmit } from '../actions/worktree'
import { selectSelectedBrowseRow } from '../store'

export type CommandHandlers = Partial<Record<HarbourCommandId, () => void | Promise<void>>>

export function createBrowserCommandHandlers(services: TuiServices, store: TuiStore): CommandHandlers {
  return {
    [harbourCommandIds.surfaceUp]: () =>
      store.getState().app.currentRoute === 'active'
        ? store.getState().moveActiveSelection(-1)
        : store.getState().moveBrowseSelection(-1),
    [harbourCommandIds.surfaceDown]: () =>
      store.getState().app.currentRoute === 'active'
        ? store.getState().moveActiveSelection(1)
        : store.getState().moveBrowseSelection(1),
    [harbourCommandIds.surfaceNextTab]: () => store.getState().nextRoute(),
    [harbourCommandIds.surfacePreviousTab]: () => store.getState().previousRoute(),
    [harbourCommandIds.surfaceToggleVisibility]: () => store.getState().toggleBrowseVisibility(),
    [harbourCommandIds.surfaceRefresh]: () => void loadProjects(services, store),
    [harbourCommandIds.surfaceBack]: () =>
      store.getState().app.currentRoute === 'active'
        ? handleActiveRouteBack(services, store)
        : handleBrowseRouteBack(services, store),
    [harbourCommandIds.surfaceSelect]: () =>
      store.getState().app.currentRoute === 'active'
        ? handleActiveRouteSelect(services, store)
        : handleBrowseRouteSelect(services, store, selectSelectedBrowseRow(store.getState())),
    [harbourCommandIds.surfaceOpenActions]: () =>
      store.getState().app.currentRoute === 'active'
        ? store.getState().openActiveActionsMenu()
        : store.getState().openBrowseActionsMenu(),
  }
}

export function createWorktreeFormCommandHandlers(
  services: TuiServices,
  store: TuiStore,
): CommandHandlers {
  return {
    [harbourCommandIds.surfaceBack]: () => store.getState().backWorktreeForm(),
    [harbourCommandIds.surfaceSelect]: () => handleWorktreeFormSubmit(services, store),
  }
}

export function createActionsCommandHandlers(services: TuiServices, store: TuiStore): CommandHandlers {
  return {
    [harbourCommandIds.surfaceBack]: () => handleBrowseRouteBack(services, store),
  }
}

export function createGlobalCommandHandlers(services: TuiServices): CommandHandlers {
  return {
    [harbourCommandIds.appQuit]: () => services.renderer.destroy(),
  }
}
