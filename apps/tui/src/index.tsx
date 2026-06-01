import { createCliRenderer } from '@opentui/core'
import { makeAppKeymap } from '@harbour/keymap'
import { KeymapProvider } from '@opentui/keymap/react'
import { createRoot } from '@opentui/react'
import { Provider, createStore } from 'jotai'

import { createSurfaceCommandHandler } from './actions/dispatch'
import { App } from './app'
import { TuiServicesProvider, type TuiServices } from './app-context'
import { readArgValue } from './helpers/args'
import type { TuiOptions } from './types'

const args = process.argv.slice(2)
const configPath = readArgValue(args, '--path')
const dbPath = readArgValue(args, '--db-path')

const store = createStore()

const options: TuiOptions = {
  configPath,
  dbPath,
}

const renderer = await createCliRenderer({
  clearOnShutdown: false,
  exitOnCtrlC: false,
  // Debug
  // consoleOptions: {
  //   position: ConsolePosition.BOTTOM,
  //   sizePercent: 30,
  // },
})

// Show the debugger
// renderer.console.toggle()

const services: TuiServices = {
  options,
  renderer,
}

const keymap = makeAppKeymap(renderer, {
  onCommand: createSurfaceCommandHandler(services, store),
})

createRoot(renderer).render(
  <Provider store={store}>
    <TuiServicesProvider value={services}>
      <KeymapProvider keymap={keymap}>
        <App />
      </KeymapProvider>
    </TuiServicesProvider>
  </Provider>,
)
