import type { CliRenderer } from '@opentui/core'
import { KeymapProvider } from '@opentui/keymap/react'
import type { Root } from '@opentui/react'

import { App } from './app'
import { TuiServicesProvider, type TuiServices } from './app-context'
import type { createTuiKeymap } from './keymap/create-keymap'
import { makeStartupTelemetry } from './observability/startup'
import type { StartupTimeline } from './observability/startup-timeline'
import { makeTuiEffectRuntime } from './services/effect-runtime'
import type { TuiOptions } from './types'

type MountTuiAppOptions = {
  isShuttingDown: () => boolean
  keymap: ReturnType<typeof createTuiKeymap>
  options: TuiOptions
  registerDispose: (dispose: () => Promise<void>) => void
  renderer: CliRenderer
  root: Root
  shutdown: () => Promise<void>
  startupTimeline: StartupTimeline
}

export async function mountTuiApp({
  isShuttingDown,
  keymap,
  options,
  registerDispose,
  renderer,
  root,
  shutdown,
  startupTimeline,
}: MountTuiAppOptions) {
  const effectRuntime = makeTuiEffectRuntime(options)
  startupTimeline.mark('effect_runtime.created')

  const telemetryState: {
    startupTelemetry?: Awaited<ReturnType<typeof makeStartupTelemetry>>
  } = {}
  let disposePromise: Promise<void> | undefined
  const dispose = () => {
    disposePromise ??= (async () => {
      telemetryState.startupTelemetry?.finish('app.shutdown')
      await effectRuntime.dispose()
    })()

    return disposePromise
  }

  registerDispose(dispose)

  if (isShuttingDown()) {
    await dispose()
    return
  }

  const startupTelemetry = await makeStartupTelemetry({
    effectRuntime,
    profile: options.profile,
    renderer,
    timeline: startupTimeline,
  })
  telemetryState.startupTelemetry = startupTelemetry
  startupTelemetry.mark('telemetry.ready')

  if (isShuttingDown()) {
    await dispose()
    return
  }

  const services: TuiServices = {
    effectRuntime,
    options,
    renderer,
    shutdown,
    startupTelemetry,
  }

  startupTelemetry.mark('ui.app_render_requested')
  root.render(
    <TuiServicesProvider value={services}>
      <KeymapProvider keymap={keymap}>
        <App />
      </KeymapProvider>
    </TuiServicesProvider>,
  )
}
