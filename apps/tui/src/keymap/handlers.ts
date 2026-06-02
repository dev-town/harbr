import { harbourCommandIds, type HarbourCommandId } from './commands'

import type { TuiServices, TuiStore } from '../app-context'
import {
  backWorktreeFormAtom,
  closeActionsMenuAtom,
  moveActionSelectionAtom,
  moveBrowseSelectionAtom,
  openActionsMenuAtom,
  toggleBrowseVisibilityAtom,
} from '../state'
import { handleActionSelect } from '../actions/actions'
import { handleBrowseBack, handleBrowseSelect } from '../actions/browser'
import { loadProjects } from '../actions/refresh'
import { handleWorktreeFormSubmit } from '../actions/worktree'

export type CommandHandlers = Partial<Record<HarbourCommandId, () => void | Promise<void>>>

export function createBrowserCommandHandlers(services: TuiServices, store: TuiStore): CommandHandlers {
  return {
    [harbourCommandIds.surfaceUp]: () => store.set(moveBrowseSelectionAtom, -1),
    [harbourCommandIds.surfaceDown]: () => store.set(moveBrowseSelectionAtom, 1),
    [harbourCommandIds.surfaceToggleVisibility]: () => store.set(toggleBrowseVisibilityAtom),
    [harbourCommandIds.surfaceRefresh]: () => void loadProjects(services, store),
    [harbourCommandIds.surfaceBack]: () => handleBrowseBack(services, store),
    [harbourCommandIds.surfaceSelect]: () => handleBrowseSelect(services, store),
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
    [harbourCommandIds.surfaceSelect]: () => handleActionSelect(services, store),
    [harbourCommandIds.surfaceBack]: () => store.set(closeActionsMenuAtom),
  }
}

export function createGlobalCommandHandlers(services: TuiServices): CommandHandlers {
  return {
    [harbourCommandIds.appQuit]: () => services.renderer.destroy(),
  }
}
