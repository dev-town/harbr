import type { HarbourCommandId } from '@harbour/domain'

import type { TuiAppContext } from '../app-context'
import { activeSurfaceAtom, globalHandlersAtom } from '../state'

export function dispatchCommand(context: TuiAppContext, commandId: HarbourCommandId) {
  const activeSurface = context.store.get(activeSurfaceAtom)
  const surfaceHandler = activeSurface?.handlers[commandId]

  if (surfaceHandler) {
    void surfaceHandler()
    return
  }

  const globals = context.store.get(globalHandlersAtom)

  for (let index = globals.length - 1; index >= 0; index -= 1) {
    const handler = globals[index]?.handlers[commandId]

    if (handler) {
      void handler()
      return
    }
  }
}
