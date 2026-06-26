import { useBindings } from '@opentui/keymap/react'

import { makeActionsModalBindings } from '~/keymap/bindings'
import { keymapPriority } from '~/keymap/priorities'

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
            bindings: makeActionsModalBindings({
              onClose,
              onMoveDown: () => moveSelection(1),
              onMoveUp: () => moveSelection(-1),
              onSelect: selectCurrent,
            }),
          }
        : { bindings: [] },
    [enabled, moveSelection, onClose, selectCurrent],
  )
}
