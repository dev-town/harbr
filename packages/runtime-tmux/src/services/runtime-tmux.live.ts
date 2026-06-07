import { execFile } from 'node:child_process'
import { isAbsolute, join } from 'node:path'
import { promisify } from 'node:util'

import { Effect, Layer } from 'effect'

import {
  findMatchingRuntime,
  formatSessionName,
  formatSessionTarget,
  parseSessionName,
} from '../session-name.util'
import { TmuxCommandError, TmuxNotFoundError } from '../runtime-tmux.errors'
import type {
  CreateRuntimeWindowsResult,
  CurrentRuntime,
  RuntimeDiscovery,
  RuntimeTarget,
  RuntimeWindowCreation,
} from '../runtime-tmux.types'
import {
  RuntimeTmuxService,
  type RuntimeTmuxServiceApi,
} from './runtime-tmux.service'

const execFileAsync = promisify(execFile)

export const RuntimeTmuxServiceLive = Layer.succeed(RuntimeTmuxService, {
  closeRuntime: closeRuntimeLive,
  createRuntimeWindows: createRuntimeWindowsLive,
  getCurrentRuntime: getCurrentRuntimeLive(),
  listRuntimes: listRuntimesLive(),
  openOrCreateRuntime: openOrCreateRuntimeLive,
} satisfies RuntimeTmuxServiceApi)

export function makeRuntimeTmuxServiceLayer() {
  return RuntimeTmuxServiceLive
}

export function listRuntimes() {
  return Effect.flatMap(
    RuntimeTmuxService,
    (service) => service.listRuntimes,
  ).pipe(Effect.provide(makeRuntimeTmuxServiceLayer()))
}

export function getCurrentRuntime() {
  return Effect.flatMap(
    RuntimeTmuxService,
    (service) => service.getCurrentRuntime,
  ).pipe(Effect.provide(makeRuntimeTmuxServiceLayer()))
}

export function openOrCreateRuntime(target: RuntimeTarget) {
  return Effect.flatMap(RuntimeTmuxService, (service) =>
    service.openOrCreateRuntime(target),
  ).pipe(Effect.provide(makeRuntimeTmuxServiceLayer()))
}

export function closeRuntime(sessionName: string) {
  return Effect.flatMap(RuntimeTmuxService, (service) =>
    service.closeRuntime(sessionName),
  ).pipe(Effect.provide(makeRuntimeTmuxServiceLayer()))
}

export function createRuntimeWindows(input: RuntimeWindowCreation) {
  return Effect.flatMap(RuntimeTmuxService, (service) =>
    service.createRuntimeWindows(input),
  ).pipe(Effect.provide(makeRuntimeTmuxServiceLayer()))
}

function getCurrentRuntimeLive() {
  return Effect.tryPromise({
    try: async () => {
      const { stdout } = await execFileAsync('tmux', [
        'display-message',
        '-p',
        '#{session_name}',
      ])
      return parseSessionName(stdout.trim()) satisfies CurrentRuntime
    },
    catch: (error) => mapTmuxError(error),
  }).pipe(
    Effect.catchTag('TmuxNotFoundError', () =>
      Effect.succeed<CurrentRuntime>(null),
    ),
    Effect.catchTag('TmuxCommandError', (error) =>
      isNoServerRunning(error.message)
        ? Effect.succeed<CurrentRuntime>(null)
        : Effect.fail(error),
    ),
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
          .map(parseSessionName)
          .filter(
            (runtime): runtime is NonNullable<typeof runtime> =>
              runtime !== null,
          ),
        runtimeIssue: null,
      } satisfies RuntimeDiscovery
    },
    catch: (error) => mapTmuxError(error),
  }).pipe(
    Effect.catchTag('TmuxNotFoundError', () =>
      Effect.succeed<RuntimeDiscovery>({
        runtimes: [],
        runtimeIssue: 'tmux_not_found',
      }),
    ),
    Effect.catchTag('TmuxCommandError', (error) =>
      isNoServerRunning(error.message)
        ? Effect.succeed<RuntimeDiscovery>({
            runtimes: [],
            runtimeIssue: null,
          })
        : Effect.fail(error),
    ),
  )
}

function openOrCreateRuntimeLive(target: RuntimeTarget) {
  return Effect.tryPromise({
    try: async () => {
      const discovery = await listRuntimeDiscoverySafe()
      const client = await getCurrentClient()
      const existingRuntime = findMatchingRuntime(discovery.runtimes, target)

      if (existingRuntime) {
        await execTmux([
          'switch-client',
          '-c',
          client,
          '-t',
          formatSessionTarget(existingRuntime.sessionName),
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
  })
}

function closeRuntimeLive(sessionName: string) {
  return Effect.tryPromise({
    try: async () => {
      await execTmux(['kill-session', '-t', formatSessionTarget(sessionName)])
    },
    catch: (error) => mapTmuxError(error),
  })
}

function createRuntimeWindowsLive(input: RuntimeWindowCreation) {
  return Effect.tryPromise({
    try: async () => {
      const sessionName = await ensureRuntimeSession(input.target)
      const existingWindowNames = await listWindowNames(sessionName)
      const createdWindowNames: string[] = []
      const skippedWindowNames: string[] = []

      for (const window of input.windows) {
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
  })
}

async function ensureRuntimeSession(target: RuntimeTarget) {
  const discovery = await listRuntimeDiscoverySafe()
  const existingRuntime = findMatchingRuntime(discovery.runtimes, target)

  if (existingRuntime) {
    return existingRuntime.sessionName
  }

  const sessionName = formatSessionName(target)
  await execTmux(['new-session', '-d', '-s', sessionName, '-c', target.cwd])
  return sessionName
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
    resolvePaneCwd(runtimeCwd, firstPane.cwd),
  )
  const panes = [{ id: firstPaneId, config: firstPane }]

  await setPaneName(firstPaneId, firstPane.name)

  for (const pane of window.panes.slice(1)) {
    const paneId = await splitWindowPane(
      firstPaneId,
      resolvePaneCwd(runtimeCwd, pane.cwd),
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
  for (const command of normalizePaneCommands(paneCommand)) {
    await execTmux(['send-keys', '-t', paneId, command, 'C-m'])
  }
}

function normalizePaneCommands(
  command: string | readonly string[] | undefined,
) {
  if (!command) {
    return []
  }

  return typeof command === 'string' ? [command] : command
}

function resolvePaneCwd(runtimeCwd: string, paneCwd: string | undefined) {
  if (!paneCwd) {
    return runtimeCwd
  }

  return isAbsolute(paneCwd) ? paneCwd : join(runtimeCwd, paneCwd)
}

async function listRuntimeDiscoverySafe() {
  try {
    return await Effect.runPromise(listRuntimesLive())
  } catch (error) {
    if (error instanceof TmuxCommandError && isNoServerRunning(error.message)) {
      return { runtimes: [], runtimeIssue: null } satisfies RuntimeDiscovery
    }

    throw error
  }
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

function isNoServerRunning(message: string) {
  return message.includes('no server running')
}

function isExecError(
  error: unknown,
): error is Error & { code?: number | string | undefined } {
  return error instanceof Error
}
