import { CliRenderEvents, createCliRenderer } from '@opentui/core'
import { KeymapProvider } from '@opentui/keymap/react'
import { createRoot } from '@opentui/react'
import { readConfigTheme } from '@harbr/config/theme'

import { StartupShell } from './components/startup-shell'
import { resolveTheme, setActiveTheme } from './config/theme'
import { readArgValue } from './helpers/args'
import { createTuiKeymap } from './keymap/create-keymap'
import {
  checkProfileEndpoint,
  formatProfileEndpointError,
  getProfileMissingValueFlag,
  readProfileOptions,
} from './observability/profile-options'
import {
  createStartupTimeline,
  type StartupTiming,
  type StartupTimeline,
} from './observability/startup-timeline'
import type { TuiOptions } from './types'

export async function launchTui(args: string[], startupTiming: StartupTiming) {
  const startupTimeline = createStartupTimeline(startupTiming)
  startupTimeline.mark('app.entry', {}, startupTiming.processStartedAt)
  startupTimeline.mark(
    'tui.bootstrap_module_loaded',
    {},
    startupTiming.tuiModuleLoadedAt,
  )

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
  startupTimeline.mark('profile.endpoint_checked')

  const options: TuiOptions = {
    ...(configPath ? { configPath } : {}),
    ...(dbPath ? { dbPath } : {}),
    ...(profile ? { profile } : {}),
  }

  const [renderer, startupTheme] = await Promise.all([
    createCliRenderer({
      clearOnShutdown: false,
      exitOnCtrlC: false,
      consoleOptions: {
        sizePercent: 30,
      },
    }),
    readConfigTheme(configPath),
  ])
  startupTimeline.mark('renderer.ready')
  startupTimeline.mark('config.ready', {
    'config.load_succeeded': startupTheme.loaded,
  })

  // Debug console
  // renderer.console.toggle()

  const activeTheme = await resolveTheme(startupTheme.theme, renderer)
  setActiveTheme(activeTheme)
  renderer.setBackgroundColor(activeTheme.backdrop)
  startupTimeline.mark('theme.ready', {
    'theme.id': startupTheme.theme,
  })

  const root = createRoot(renderer)
  const keymap = createTuiKeymap(renderer)
  const abortController = new AbortController()
  let operationalDispose: (() => Promise<void>) | undefined
  let shutdownPromise: Promise<void> | undefined

  const shutdown = () => {
    shutdownPromise ??= (async () => {
      abortController.abort()
      await operationalDispose?.()
      root.unmount()
      renderer.destroy()
    })()

    return shutdownPromise
  }

  const startupPaint = waitForStartupPaint({
    renderer,
    signal: abortController.signal,
    startupTimeline,
  })
  const onBootstrapCommit = () => {
    startupTimeline.mark('ui.bootstrap_committed')
    startupPaint.committed()
  }

  startupTimeline.mark('ui.bootstrap_render_requested')
  root.render(
    <KeymapProvider keymap={keymap}>
      <StartupShell
        onCommit={onBootstrapCommit}
        onQuit={() => void shutdown()}
      />
    </KeymapProvider>,
  )

  if (!(await startupPaint.promise) || abortController.signal.aborted) {
    return
  }

  try {
    const { mountTuiApp } = await import('./mount-tui-app')
    startupTimeline.mark('tui.operational_module_loaded')

    if (abortController.signal.aborted) {
      return
    }

    await mountTuiApp({
      isShuttingDown: () => abortController.signal.aborted,
      keymap,
      options,
      registerDispose: (dispose) => {
        operationalDispose = dispose

        if (abortController.signal.aborted) {
          void dispose()
        }
      },
      renderer,
      root,
      shutdown,
      startupTimeline,
    })
  } catch (error) {
    if (abortController.signal.aborted) {
      return
    }

    await operationalDispose?.()

    root.render(
      <KeymapProvider keymap={keymap}>
        <StartupShell
          error={formatStartupError(error)}
          onCommit={() => undefined}
          onQuit={() => void shutdown()}
        />
      </KeymapProvider>,
    )
  }
}

function waitForStartupPaint({
  renderer,
  signal,
  startupTimeline,
}: {
  renderer: Awaited<ReturnType<typeof createCliRenderer>>
  signal: AbortSignal
  startupTimeline: StartupTimeline
}) {
  let hasCommitted = false
  const promise = new Promise<boolean>((resolve) => {
    let hasRenderedFrame = false

    const finish = (painted: boolean) => {
      renderer.off(CliRenderEvents.FRAME, onFrame)
      signal.removeEventListener('abort', onAbort)
      resolve(painted)
    }
    const onAbort = () => finish(false)
    const onFrame = (event: { frameId: number }) => {
      const markedAt = performance.now()

      if (!hasRenderedFrame) {
        hasRenderedFrame = true
        startupTimeline.mark(
          'renderer.first_frame',
          { 'ui.frame_id': event.frameId },
          markedAt,
        )
      }

      if (!hasCommitted) {
        return
      }

      startupTimeline.mark(
        'ui.first_paint',
        { 'ui.frame_id': event.frameId },
        markedAt,
      )
      finish(true)
    }

    renderer.on(CliRenderEvents.FRAME, onFrame)
    signal.addEventListener('abort', onAbort, { once: true })
  })

  return {
    committed: () => {
      hasCommitted = true
    },
    promise,
  }
}

function formatStartupError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  return `Harbr could not finish starting: ${message}`
}
