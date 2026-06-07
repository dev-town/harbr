import { createCliRenderer } from '@opentui/core'
import { KeymapProvider } from '@opentui/keymap/react'
import { createRoot } from '@opentui/react'

import { App } from './app'
import { TuiServicesProvider, type TuiServices } from './app-context'
import { readArgValue } from './helpers/args'
import { createTuiKeymap } from './keymap/create-keymap'
import type { TuiOptions } from './types'

const args = process.argv.slice(2)
const configPath = readArgValue(args, '--path')
const dbPath = readArgValue(args, '--db-path')

const options: TuiOptions = {
  configPath,
  dbPath,
}

const renderer = await createCliRenderer({
  clearOnShutdown: false,
  exitOnCtrlC: false,
  consoleOptions: {
    sizePercent: 30,
  },
})

// Debug console
// renderer.console.toggle()

const services: TuiServices = {
  options,
  renderer,
}

const keymap = createTuiKeymap(renderer)

createRoot(renderer).render(
  <TuiServicesProvider value={services}>
    <KeymapProvider keymap={keymap}>
      <App />
    </KeymapProvider>
  </TuiServicesProvider>,
)
