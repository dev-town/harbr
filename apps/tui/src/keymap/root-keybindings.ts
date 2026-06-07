import { useBindings } from '@opentui/keymap/react'

import { useTuiServices } from '../hooks/useTuiServices'
import { tuiStore } from '../store'
import { makeRootBindings } from './bindings'
import { keymapPriority } from './priorities'

export function useRootKeybindings() {
  const { renderer } = useTuiServices()

  useBindings(
    () => ({
      priority: keymapPriority.root,
      bindings: makeRootBindings({
        onHelp: () => tuiStore.getState().openHelpModal(),
        onQuit: () => renderer.destroy(),
      }),
    }),
    [renderer],
  )
}
