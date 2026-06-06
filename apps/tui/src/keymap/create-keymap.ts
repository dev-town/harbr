import type { CliRenderer } from '@opentui/core'
import { createDefaultOpenTuiKeymap } from '@opentui/keymap/opentui'

export function createTuiKeymap(renderer: CliRenderer) {
  return createDefaultOpenTuiKeymap(renderer)
}
