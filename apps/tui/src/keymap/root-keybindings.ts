import { useBindings } from '@opentui/keymap/react'

import { useTuiServices } from '../hooks/useTuiServices'
import { keymapPriority } from './priorities'

export function useRootKeybindings() {
  const { renderer } = useTuiServices()

  useBindings(
    () => ({
      priority: keymapPriority.root,
      bindings: [{ key: 'ctrl+c', cmd: () => renderer.destroy() }],
    }),
    [renderer],
  )
}
