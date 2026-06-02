import type { CliRenderer } from '@opentui/core'
import { createDefaultOpenTuiKeymap } from '@opentui/keymap/opentui'

export type AppKeymapHandlers<TCommandId extends string = string> = {
  bindings: readonly { key: string; cmd: TCommandId }[]
  commands: readonly TCommandId[]
  onCommand: (commandId: TCommandId) => void
}

export function makeAppKeymap<TCommandId extends string>(
  renderer: CliRenderer,
  handlers: AppKeymapHandlers<TCommandId>,
) {
  const keymap = createDefaultOpenTuiKeymap(renderer)

  keymap.registerLayer({
    commands: handlers.commands.map((name) => ({
      name,
      run: () => handlers.onCommand(name),
    })),
    bindings: [...handlers.bindings],
  })

  return keymap
}
