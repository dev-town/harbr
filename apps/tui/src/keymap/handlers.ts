import { harbourCommandIds, type HarbourCommandId } from '@harbour/domain'

import type { TuiServices, TuiStore } from '../app-context'
import {
  closeActionsMenuAtom,
  focusBrowseSearchAtom,
  moveActionSelectionAtom,
  moveBrowseSelectionAtom,
  openActionsMenuAtom,
  toggleBrowseVisibilityAtom,
} from '../state'
import { handleActionSelect } from '../actions/actions'
import { handleBrowseBack, handleBrowseSelect } from '../actions/browser'
import { loadProjects } from '../actions/refresh'

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
    [harbourCommandIds.surfaceFocusSearch]: () => store.set(focusBrowseSearchAtom),
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
