import type { CliRenderer } from '@opentui/core'
import {
  harbourCommandIds,
  type HarbourCommandId,
} from '@harbour/domain'
import { createDefaultOpenTuiKeymap } from '@opentui/keymap/opentui'

export type AppKeymapHandlers = {
  onCommand: (commandId: HarbourCommandId) => void
}

export function makeAppKeymap(
  renderer: CliRenderer,
  handlers: AppKeymapHandlers,
) {
  const keymap = createDefaultOpenTuiKeymap(renderer)

  keymap.registerLayer({
    commands: Object.values(harbourCommandIds).map((name) => ({
      name,
      run: () => handlers.onCommand(name),
    })),
    bindings: [
      { key: 'up', cmd: harbourCommandIds.surfaceUp },
      { key: 'down', cmd: harbourCommandIds.surfaceDown },
      { key: 'return', cmd: harbourCommandIds.surfaceSelect },
      { key: '/', cmd: harbourCommandIds.surfaceFocusSearch },
      { key: 'tab', cmd: harbourCommandIds.surfaceToggleVisibility },
      { key: 'escape', cmd: harbourCommandIds.surfaceBack },
      { key: 'ctrl+r', cmd: harbourCommandIds.surfaceRefresh },
      { key: 'ctrl+a', cmd: harbourCommandIds.surfaceOpenActions },
      { key: '?', cmd: harbourCommandIds.surfaceOpenActions },
      { key: 'ctrl+c', cmd: harbourCommandIds.appQuit },
    ],
  })

  return keymap
}
