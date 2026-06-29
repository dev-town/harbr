import { createCliRenderer } from '@opentui/core'
import { KeymapProvider } from '@opentui/keymap/react'
import { createRoot } from '@opentui/react'

import { App } from './app'
import { TuiServicesProvider, type TuiServices } from './app-context'
import { readArgValue } from './helpers/args'
import { createTuiKeymap } from './keymap/create-keymap'
import {
  checkProfileEndpoint,
  formatProfileEndpointError,
  getProfileMissingValueFlag,
  readProfileOptions,
} from './observability/profile-options'
import { makeTuiEffectRuntime } from './services/effect-runtime'
import type { TuiOptions } from './types'

export async function launchTui(args: string[]) {
  const configPath = readArgValue(args, '--path')
  const dbPath = readArgValue(args, '--db-path')
  const profile = readProfileOptions(args)
  const missingFlag = getProfileMissingValueFlag(args)

  if (missingFlag) {
    console.error(`missing value for ${missingFlag}`)
    process.exitCode = 1
    return
  }

  if (profile && !(await checkProfileEndpoint(profile.endpoint))) {
    console.error(formatProfileEndpointError(profile.endpoint))
    process.exitCode = 1
    return
  }

  const options: TuiOptions = {
    ...(configPath ? { configPath } : {}),
    ...(dbPath ? { dbPath } : {}),
    ...(profile ? { profile } : {}),
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

  const effectRuntime = makeTuiEffectRuntime(options)
  let isShuttingDown = false

  async function shutdown() {
    if (isShuttingDown) {
      return
    }

    isShuttingDown = true
    await effectRuntime.dispose()
    renderer.destroy()
  }

  const services: TuiServices = {
    effectRuntime,
    options,
    renderer,
    shutdown,
  }

  const keymap = createTuiKeymap(renderer)

  createRoot(renderer).render(
    <TuiServicesProvider value={services}>
      <KeymapProvider keymap={keymap}>
        <App />
      </KeymapProvider>
    </TuiServicesProvider>,
  )
}
