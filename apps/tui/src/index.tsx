import { createCliRenderer } from '@opentui/core'
import { makeBrowseKeymap } from '@harbour/keymap'
import { KeymapProvider } from '@opentui/keymap/react'
import { createRoot } from '@opentui/react'
import { Provider, createStore } from 'jotai'

import { createBrowseCommandHandler } from './actions'
import { App } from './app'
import { TuiContextProvider, type TuiAppContext } from './app-context'
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
})

const context: TuiAppContext = {
  options,
  renderer,
  store,
}

const keymap = makeBrowseKeymap(renderer, {
  onCommand: createBrowseCommandHandler(context),
})

createRoot(renderer).render(
  <Provider store={store}>
    <TuiContextProvider value={context}>
      <KeymapProvider keymap={keymap}>
        <App context={context} />
      </KeymapProvider>
    </TuiContextProvider>
  </Provider>,
)
