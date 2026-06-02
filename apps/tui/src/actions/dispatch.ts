import { harbourCommandIds, type HarbourCommandId } from '@harbour/domain'

import type { TuiServices, TuiStore } from '../app-context'
import { isActionsOpenAtom, isWorktreeFormOpenAtom } from '../state'
import {
  createActionsCommandHandlers,
  createBrowserCommandHandlers,
  createGlobalCommandHandlers,
  createWorktreeFormCommandHandlers,
} from '../keymap/handlers'

export function dispatchCommand(services: TuiServices, store: TuiStore, commandId: HarbourCommandId) {
  const surfaceHandlers = store.get(isWorktreeFormOpenAtom)
    ? createWorktreeFormCommandHandlers(services, store)
    : store.get(isActionsOpenAtom)
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
