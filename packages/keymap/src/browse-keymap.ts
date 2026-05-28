import type { CliRenderer } from '@opentui/core'
import {
  harbourCommandIds,
  type HarbourCommandId,
} from '@harbour/domain'
import { createDefaultOpenTuiKeymap } from '@opentui/keymap/opentui'

export type BrowseKeymapHandlers = {
  onCommand: (commandId: HarbourCommandId) => void
}

export function makeBrowseKeymap(
  renderer: CliRenderer,
  handlers: BrowseKeymapHandlers,
) {
  const keymap = createDefaultOpenTuiKeymap(renderer)

  keymap.registerLayer({
    commands: Object.values(harbourCommandIds).map((name) => ({
      name,
      run: () => handlers.onCommand(name),
    })),
    bindings: [
      { key: 'up', cmd: harbourCommandIds.browseUp },
      { key: 'down', cmd: harbourCommandIds.browseDown },
      { key: 'return', cmd: harbourCommandIds.browseSelect },
      { key: '/', cmd: harbourCommandIds.browseFocusSearch },
      { key: 'tab', cmd: harbourCommandIds.browseToggleVisibility },
      { key: 'escape', cmd: harbourCommandIds.browseBack },
      { key: 'ctrl+r', cmd: harbourCommandIds.browseRefresh },
      { key: 'ctrl+a', cmd: harbourCommandIds.browseOpenActions },
      { key: '?', cmd: harbourCommandIds.browseOpenActions },
      { key: 'ctrl+c', cmd: harbourCommandIds.appQuit },
    ],
  })

  return keymap
}
