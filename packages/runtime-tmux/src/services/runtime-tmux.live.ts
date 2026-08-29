import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { Effect, Layer } from 'effect'
import type {
  RuntimeFact,
  RuntimeIdentity,
  RuntimeObservation,
  RuntimeTarget,
} from '@harbr/domain'
import {
  RuntimeDiscoveryService,
  RuntimeProviderError,
  RuntimeService,
  normalizeRuntimePaneCommands,
  resolveRuntimePaneCwd,
  type CreateRuntimeWindowsResult,
  type CurrentRuntime,
  type RuntimeDiscovery,
  type RuntimeDiscoveryServiceApi,
  type RuntimeServiceApi,
  type RuntimeWindowCreation,
} from '@harbr/runtime'

import {
  findMatchingRuntime,
  formatSessionName,
  formatSessionTarget,
  parseSessionName,
} from '../session-name.util'
import { classifyRuntimeDiscoveryIssue } from '../runtime-tmux.discovery'
import { TmuxCommandError, TmuxNotFoundError } from '../runtime-tmux.errors'
import { getTmuxRuntimeSource } from '../runtime-tmux.source'

const execFileAsync = promisify(execFile)
const source = getTmuxRuntimeSource()

export const RuntimeServiceLive = Layer.succeed(RuntimeService, {
  closeRuntime: closeRuntimeLive,
  createRuntimeWindows: createRuntimeWindowsLive,
  getCurrentRuntime: getCurrentRuntimeLive(),
  openOrCreateRuntime: openOrCreateRuntimeLive,
  source,
} satisfies RuntimeServiceApi)

export const RuntimeDiscoveryServiceLive = Layer.succeed(
  RuntimeDiscoveryService,
  {
    listRuntimes: listRuntimesLive(),
  } satisfies RuntimeDiscoveryServiceApi,
)

function getCurrentRuntimeLive() {
  return Effect.tryPromise({
    try: async () => {
      const { stdout } = await execFileAsync('tmux', [
        'display-message',
        '-p',
        '#{session_name}',
      ])
      const runtime = parseSessionName(stdout.trim(), source)

      return runtime
        ? { identity: runtime.identity, status: runtime.status }
        : (null satisfies CurrentRuntime)
    },
    catch: (error) => mapTmuxError(error),
  }).pipe(
    Effect.catchTag('TmuxNotFoundError', () =>
      Effect.succeed<CurrentRuntime>(null),
    ),
    Effect.catchTag('TmuxCommandError', (error) =>
      classifyRuntimeDiscoveryIssue(error.message) !== undefined
        ? Effect.succeed<CurrentRuntime>(null)
        : Effect.fail(toRuntimeProviderError('getCurrentRuntime', error)),
    ),
    Effect.withSpan('runtime.tmux.getCurrentRuntime'),
  )
}

function listRuntimesLive() {
  return Effect.tryPromise({
    try: async () => {
      const { stdout } = await execFileAsync('tmux', [
        'list-sessions',
        '-F',
        '#{session_name}',
      ])

      return {
        runtimes: stdout
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map((sessionName) => parseSessionName(sessionName, source))
          .filter(
            (runtime): runtime is NonNullable<typeof runtime> =>
              runtime !== null,
          ),
        runtimeIssue: null,
        source,
      } satisfies RuntimeDiscovery
    },
    catch: (error) => mapTmuxError(error),
  }).pipe(
    Effect.catchTag('TmuxNotFoundError', () =>
      Effect.succeed<RuntimeDiscovery>({
        runtimes: [],
        runtimeIssue: { code: 'provider_not_found', source },
        source,
      }),
    ),
    Effect.catchTag('TmuxCommandError', (error) => {
      const runtimeIssue = classifyRuntimeDiscoveryIssue(error.message)

      return runtimeIssue !== undefined
        ? Effect.succeed<RuntimeDiscovery>({
            runtimes: [],
            runtimeIssue:
              runtimeIssue === null ? null : { code: runtimeIssue, source },
            source,
          })
        : Effect.fail(toRuntimeProviderError('listRuntimes', error))
    }),
    Effect.withSpan('runtime.tmux.listRuntimes'),
  )
}

function openOrCreateRuntimeLive(target: RuntimeTarget) {
  return Effect.tryPromise({
    try: async () => {
      const discovery = await listRuntimeDiscoverySafe()
      const client = await getCurrentClient()
      const existingRuntime = findMatchingRuntime(
        runtimeFacts(discovery.runtimes),
        target,
      )

      if (existingRuntime) {
        await execTmux([
          'switch-client',
          '-c',
          client,
          '-t',
          formatSessionTarget(existingRuntime.identity.externalId),
        ])
        return
      }

      const sessionName = formatSessionName(target)
      await execTmux(['new-session', '-d', '-s', sessionName, '-c', target.cwd])
      await execTmux([
        'switch-client',
        '-c',
        client,
        '-t',
        formatSessionTarget(sessionName),
      ])
    },
    catch: (error) => mapTmuxError(error),
  }).pipe(
    Effect.mapError((error) =>
      toRuntimeProviderError('openOrCreateRuntime', error),
    ),
    Effect.withSpan('runtime.tmux.openOrCreateRuntime', {
      attributes: {
        'harbr.project.name': target.projectName,
        'harbr.runtime.scope': getRuntimeTargetScope(target),
      },
    }),
  )
}

function closeRuntimeLive(identity: RuntimeIdentity) {
  return Effect.tryPromise({
    try: async () => {
      assertCurrentSource(identity)
      await execTmux([
        'kill-session',
        '-t',
        formatSessionTarget(identity.externalId),
      ])
    },
    catch: (error) => mapTmuxError(error),
  }).pipe(
    Effect.mapError((error) => toRuntimeProviderError('closeRuntime', error)),
    Effect.withSpan('runtime.tmux.closeRuntime', {
      attributes: {
        'tmux.session.name': identity.externalId,
      },
    }),
  )
}

function createRuntimeWindowsLive(input: RuntimeWindowCreation) {
  return Effect.tryPromise({
    try: async () => {
      const discovery = await listRuntimeDiscoverySafe()
      const existingRuntime = findMatchingRuntime(
        runtimeFacts(discovery.runtimes),
        input.target,
      )
      const firstWindow = input.windows[0]
      const sessionName =
        existingRuntime?.identity.externalId ?? formatSessionName(input.target)
      let existingWindowNames = new Set<string>()
      let windowsToCreate = input.windows
      const createdWindowNames: string[] = []
      const skippedWindowNames: string[] = []

      if (existingRuntime) {
        existingWindowNames = await listWindowNames(sessionName)
      } else if (firstWindow) {
        await createSessionWindowLayout(
          sessionName,
          input.target.cwd,
          firstWindow,
        )
        existingWindowNames.add(firstWindow.name)
        createdWindowNames.push(firstWindow.name)
        windowsToCreate = input.windows.slice(1)
      } else {
        await execTmux([
          'new-session',
          '-d',
          '-s',
          sessionName,
          '-c',
          input.target.cwd,
        ])
      }

      for (const window of windowsToCreate) {
        if (existingWindowNames.has(window.name)) {
          skippedWindowNames.push(window.name)
          continue
        }

        await createWindowLayout(sessionName, input.target.cwd, window)
        existingWindowNames.add(window.name)
        createdWindowNames.push(window.name)
      }

      if (createdWindowNames.length > 0) {
        const client = await getCurrentClient()
        await execTmux([
          'switch-client',
          '-c',
          client,
          '-t',
          formatSessionTarget(sessionName),
        ])
      }

      return {
        createdWindowNames,
        skippedWindowNames,
      } satisfies CreateRuntimeWindowsResult
    },
    catch: (error) => mapTmuxError(error),
  }).pipe(
    Effect.mapError((error) =>
      toRuntimeProviderError('createRuntimeWindows', error),
    ),
    Effect.withSpan('runtime.tmux.createRuntimeWindows', {
      attributes: {
        'harbr.project.name': input.target.projectName,
        'harbr.runtime.scope': getRuntimeTargetScope(input.target),
        'harbr.window.count': input.windows.length,
      },
    }),
  )
}

function getRuntimeTargetScope(target: RuntimeTarget) {
  if (target.moduleName) {
    return 'module'
  }

  if (target.workspaceName) {
    return 'workspace'
  }

  return 'project'
}

async function listWindowNames(sessionName: string) {
  const { stdout } = await execFileAsync('tmux', [
    'list-windows',
    '-t',
    formatSessionTarget(sessionName),
    '-F',
    '#{window_name}',
  ])

  return new Set(
    stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
  )
}

async function createWindowLayout(
  sessionName: string,
  runtimeCwd: string,
  window: RuntimeWindowCreation['windows'][number],
) {
  const firstPane = window.panes[0]

  if (!firstPane) {
    return
  }

  const firstPaneId = await createWindowPane(
    sessionName,
    window.name,
    resolveRuntimePaneCwd(runtimeCwd, firstPane.cwd),
  )
  const panes = [{ id: firstPaneId, config: firstPane }]

  await setPaneName(firstPaneId, firstPane.name)

  for (const pane of window.panes.slice(1)) {
    const paneId = await splitWindowPane(
      firstPaneId,
      resolveRuntimePaneCwd(runtimeCwd, pane.cwd),
    )
    await setPaneName(paneId, pane.name)
    panes.push({ id: paneId, config: pane })
  }

  if (panes.length > 1) {
    await execTmux(['select-layout', '-t', firstPaneId, 'tiled'])
  }

  for (const pane of panes) {
    await sendPaneCommands(pane.id, pane.config.command)
  }
}

async function createSessionWindowLayout(
  sessionName: string,
  runtimeCwd: string,
  window: RuntimeWindowCreation['windows'][number],
) {
  const firstPane = window.panes[0]
  const firstPaneId = await createSessionWindowPane(
    sessionName,
    window.name,
    firstPane ? resolveRuntimePaneCwd(runtimeCwd, firstPane.cwd) : runtimeCwd,
  )

  if (!firstPane) {
    return
  }

  const panes = [{ id: firstPaneId, config: firstPane }]

  await setPaneName(firstPaneId, firstPane.name)

  for (const pane of window.panes.slice(1)) {
    const paneId = await splitWindowPane(
      firstPaneId,
      resolveRuntimePaneCwd(runtimeCwd, pane.cwd),
    )
    await setPaneName(paneId, pane.name)
    panes.push({ id: paneId, config: pane })
  }

  if (panes.length > 1) {
    await execTmux(['select-layout', '-t', firstPaneId, 'tiled'])
  }

  for (const pane of panes) {
    await sendPaneCommands(pane.id, pane.config.command)
  }
}

async function createSessionWindowPane(
  sessionName: string,
  windowName: string,
  cwd: string,
) {
  const { stdout } = await execFileAsync('tmux', [
    'new-session',
    '-d',
    '-P',
    '-F',
    '#{pane_id}',
    '-s',
    sessionName,
    '-n',
    windowName,
    '-c',
    cwd,
  ])

  return stdout.trim()
}

async function createWindowPane(
  sessionName: string,
  windowName: string,
  cwd: string,
) {
  const { stdout } = await execFileAsync('tmux', [
    'new-window',
    '-d',
    '-P',
    '-F',
    '#{pane_id}',
    '-t',
    formatSessionTarget(sessionName),
    '-n',
    windowName,
    '-c',
    cwd,
  ])

  return stdout.trim()
}

async function splitWindowPane(targetPaneId: string, cwd: string) {
  const { stdout } = await execFileAsync('tmux', [
    'split-window',
    '-d',
    '-P',
    '-F',
    '#{pane_id}',
    '-t',
    targetPaneId,
    '-c',
    cwd,
  ])

  return stdout.trim()
}

async function setPaneName(paneId: string, paneName: string) {
  await execTmux(['select-pane', '-t', paneId, '-T', paneName])
}

async function sendPaneCommands(
  paneId: string,
  paneCommand: RuntimeWindowCreation['windows'][number]['panes'][number]['command'],
) {
  for (const command of normalizeRuntimePaneCommands(paneCommand)) {
    await execTmux(['send-keys', '-t', paneId, command, 'C-m'])
  }
}

async function listRuntimeDiscoverySafe() {
  return Effect.runPromise(listRuntimesLive())
}

async function execTmux(args: string[]) {
  await execFileAsync('tmux', args)
}

async function getCurrentClient() {
  const { stdout } = await execFileAsync('tmux', [
    'display-message',
    '-p',
    '#{client_tty}',
  ])

  return stdout.trim()
}

function mapTmuxError(error: unknown) {
  if (isExecError(error) && error.code === 'ENOENT') {
    return new TmuxNotFoundError()
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : String(error)

  return new TmuxCommandError({ message })
}

function toRuntimeProviderError(operation: string, error: unknown) {
  return new RuntimeProviderError({
    message:
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : String(error),
    operation,
    provider: source.provider,
  })
}

function assertCurrentSource(identity: RuntimeIdentity) {
  if (
    identity.source.provider !== source.provider ||
    identity.source.sourceId !== source.sourceId
  ) {
    throw new Error('runtime does not belong to the active tmux source')
  }
}

function isExecError(
  error: unknown,
): error is Error & { code?: number | string | undefined } {
  return error instanceof Error
}

function isRuntimeFact(runtime: RuntimeObservation): runtime is RuntimeFact {
  return !('contextPath' in runtime)
}

function runtimeFacts(runtimes: readonly RuntimeObservation[]): RuntimeFact[] {
  return runtimes.filter(isRuntimeFact)
}
