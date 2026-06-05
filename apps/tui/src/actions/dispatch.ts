import { harbourCommandIds, type HarbourCommandId } from '../keymap/commands'

import type { TuiServices, TuiStore } from '../app-context'
import {
  closeActionsMenuAtom as closeActiveActionsMenuAtom,
  isActionsOpenAtom as isActiveActionsOpenAtom,
} from '../routes/active'
import {
  getActiveActionsModalHandle,
} from '../routes/active/actions-modal-controller'
import { getBrowseActionsModalHandle } from '../routes/browse/actions-modal-controller'
import {
  closeActionsMenuAtom as closeBrowseActionsMenuAtom,
  isActionsOpenAtom as isBrowseActionsOpenAtom,
  isWorktreeFormOpenAtom,
} from '../routes/browse'
import {
  createActionsCommandHandlers,
  createBrowserCommandHandlers,
  createGlobalCommandHandlers,
  createWorktreeFormCommandHandlers,
} from '../keymap/handlers'

export function dispatchCommand(services: TuiServices, store: TuiStore, commandId: HarbourCommandId) {
  if (store.get(isActiveActionsOpenAtom)) {
    const activeHandle = getActiveActionsModalHandle()

    if (handleActionsModalCommand(commandId, activeHandle)) {
      return
    }

    if (commandId === harbourCommandIds.surfaceBack) {
      store.set(closeActiveActionsMenuAtom)
      return
    }
  }

  if (store.get(isBrowseActionsOpenAtom)) {
    const browseHandle = getBrowseActionsModalHandle()

    if (handleActionsModalCommand(commandId, browseHandle)) {
      return
    }

    if (commandId === harbourCommandIds.surfaceBack) {
      store.set(closeBrowseActionsMenuAtom)
      return
    }
  }

  const surfaceHandlers = store.get(isWorktreeFormOpenAtom)
    ? createWorktreeFormCommandHandlers(services, store)
    : store.get(isBrowseActionsOpenAtom)
      ? createActionsCommandHandlers(services, store)
      : createBrowserCommandHandlers(services, store)
  const surfaceHandler = surfaceHandlers[commandId]

  if (surfaceHandler) {
    void surfaceHandler()
    return
  }

  const globalHandler = createGlobalCommandHandlers(services)[commandId]

  if (globalHandler) {
    void globalHandler()
  }
}

export function createSurfaceCommandHandler(services: TuiServices, store: TuiStore) {
  return (commandId: string) =>
    dispatchCommand(
      services,
      store,
      commandId as (typeof harbourCommandIds)[keyof typeof harbourCommandIds],
    )
}

function handleActionsModalCommand(commandId: HarbourCommandId, handle: ReturnType<typeof getActiveActionsModalHandle>) {
  if (!handle) {
    return false
  }

  switch (commandId) {
    case harbourCommandIds.surfaceUp:
      handle.moveSelection(-1)
      return true
    case harbourCommandIds.surfaceDown:
      handle.moveSelection(1)
      return true
    case harbourCommandIds.surfaceSelect:
      handle.activateSelection()
      return true
    case harbourCommandIds.surfaceBack:
      handle.close()
      return true
    default:
      return false
  }
}
