import { execFile } from 'node:child_process'
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
  CurrentRuntime,
  RuntimeDiscovery,
  RuntimeTarget,
} from '../runtime-tmux.types'
import {
  RuntimeTmuxService,
  type RuntimeTmuxServiceApi,
} from './runtime-tmux.service'

const execFileAsync = promisify(execFile)

export const RuntimeTmuxServiceLive = Layer.succeed(RuntimeTmuxService, {
  getCurrentRuntime: getCurrentRuntimeLive(),
  listRuntimes: listRuntimesLive(),
  openOrCreateRuntime: openOrCreateRuntimeLive,
} satisfies RuntimeTmuxServiceApi)

export function makeRuntimeTmuxServiceLayer() {
  return RuntimeTmuxServiceLive
}

export function listRuntimes() {
  return Effect.flatMap(RuntimeTmuxService, (service) => service.listRuntimes).pipe(
    Effect.provide(makeRuntimeTmuxServiceLayer()),
  )
}

export function getCurrentRuntime() {
  return Effect.flatMap(RuntimeTmuxService, (service) => service.getCurrentRuntime).pipe(
    Effect.provide(makeRuntimeTmuxServiceLayer()),
  )
}

export function openOrCreateRuntime(target: RuntimeTarget) {
  return Effect.flatMap(RuntimeTmuxService, (service) => service.openOrCreateRuntime(target)).pipe(
    Effect.provide(makeRuntimeTmuxServiceLayer()),
  )
}

function getCurrentRuntimeLive() {
  return Effect.tryPromise({
    try: async () => {
      const { stdout } = await execFileAsync('tmux', ['display-message', '-p', '#{session_name}'])
      return parseSessionName(stdout.trim()) satisfies CurrentRuntime
    },
    catch: (error) => mapTmuxError(error),
  }).pipe(
    Effect.catchTag('TmuxNotFoundError', () => Effect.succeed<CurrentRuntime>(null)),
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
          .filter((runtime): runtime is NonNullable<typeof runtime> => runtime !== null),
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
        await execTmux(['switch-client', '-c', client, '-t', formatSessionTarget(existingRuntime.sessionName)])
        return
      }

      const sessionName = formatSessionName(target)
      await execTmux(['new-session', '-d', '-s', sessionName, '-c', target.cwd])
      await execTmux(['switch-client', '-c', client, '-t', formatSessionTarget(sessionName)])
    },
    catch: (error) => mapTmuxError(error),
  })
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
  const { stdout } = await execFileAsync('tmux', ['display-message', '-p', '#{client_tty}'])

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
