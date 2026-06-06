import { useBindings } from '@opentui/keymap/react'

import { keymapPriority } from '../../../keymap/priorities'

type UseActionKeybindingsArgs = {
  enabled: boolean
  moveSelection: (delta: number) => void
  onClose: () => void
  selectCurrent: () => void
}

export function useActionKeybindings({
  enabled,
  moveSelection,
  onClose,
  selectCurrent,
}: UseActionKeybindingsArgs) {
  useBindings(
    () =>
      enabled
        ? {
            priority: keymapPriority.modal,
            bindings: [
              { key: 'up', cmd: () => moveSelection(-1) },
              { key: 'down', cmd: () => moveSelection(1) },
              { key: 'return', cmd: selectCurrent },
              { key: 'escape', cmd: onClose },
            ],
          }
        : { bindings: [] },
    [enabled, moveSelection, onClose, selectCurrent],
  )
}
