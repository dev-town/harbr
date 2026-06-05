import { harbourCommandIds, type HarbourCommandId } from './commands'

import type { TuiServices, TuiStore } from '../app-context'
import {
  handleActiveRouteBack,
  handleActiveRouteSelect,
  moveActiveSelectionAtom,
} from '../routes/active'
import {
  backWorktreeFormAtom,
  handleBrowseActionSelect,
  handleBrowseRouteBack,
  handleBrowseRouteSelect,
  moveActionSelectionAtom,
  moveBrowseSelectionAtom,
  openActionsMenuAtom,
  selectedBrowseRowAtom,
  toggleBrowseVisibilityAtom,
} from '../routes/browse'
import {
  nextRouteAtom,
  previousRouteAtom,
} from '../state'
import { currentRouteAtom } from '../state/app'
import { loadProjects } from '../actions/refresh'
import { handleWorktreeFormSubmit } from '../actions/worktree'

export type CommandHandlers = Partial<Record<HarbourCommandId, () => void | Promise<void>>>

export function createBrowserCommandHandlers(services: TuiServices, store: TuiStore): CommandHandlers {
  return {
    [harbourCommandIds.surfaceUp]: () =>
      store.set(store.get(currentRouteAtom) === 'active' ? moveActiveSelectionAtom : moveBrowseSelectionAtom, -1),
    [harbourCommandIds.surfaceDown]: () =>
      store.set(store.get(currentRouteAtom) === 'active' ? moveActiveSelectionAtom : moveBrowseSelectionAtom, 1),
    [harbourCommandIds.surfaceNextTab]: () => store.set(nextRouteAtom),
    [harbourCommandIds.surfacePreviousTab]: () => store.set(previousRouteAtom),
    [harbourCommandIds.surfaceToggleVisibility]: () => store.set(toggleBrowseVisibilityAtom),
    [harbourCommandIds.surfaceRefresh]: () => void loadProjects(services, store),
    [harbourCommandIds.surfaceBack]: () =>
      store.get(currentRouteAtom) === 'active'
        ? handleActiveRouteBack(services, store)
        : handleBrowseRouteBack(services, store),
    [harbourCommandIds.surfaceSelect]: () =>
      store.get(currentRouteAtom) === 'active'
        ? handleActiveRouteSelect(services, store)
        : handleBrowseRouteSelect(services, store, store.get(selectedBrowseRowAtom)),
    [harbourCommandIds.surfaceOpenActions]: () => store.set(openActionsMenuAtom),
  }
}

export function createWorktreeFormCommandHandlers(
  services: TuiServices,
  store: TuiStore,
): CommandHandlers {
  return {
    [harbourCommandIds.surfaceBack]: () => store.set(backWorktreeFormAtom),
    [harbourCommandIds.surfaceSelect]: () => handleWorktreeFormSubmit(services, store),
  }
}

export function createActionsCommandHandlers(services: TuiServices, store: TuiStore): CommandHandlers {
  return {
    [harbourCommandIds.surfaceUp]: () => store.set(moveActionSelectionAtom, -1),
    [harbourCommandIds.surfaceDown]: () => store.set(moveActionSelectionAtom, 1),
    [harbourCommandIds.surfaceSelect]: () => handleBrowseActionSelect(services, store),
    [harbourCommandIds.surfaceBack]: () => handleBrowseRouteBack(services, store),
  }
}

export function createGlobalCommandHandlers(services: TuiServices): CommandHandlers {
  return {
    [harbourCommandIds.appQuit]: () => services.renderer.destroy(),
  }
}
