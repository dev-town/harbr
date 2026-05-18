import { describe, expect, it } from 'vitest'
import { Effect, Layer } from 'effect'

import type {
  CurrentRuntime,
  RuntimeDiscovery,
  RuntimeTarget,
} from './runtime-tmux.types'
import {
  findMatchingRuntime,
  formatSessionName,
  formatSessionTarget,
  parseSessionName,
} from './session-name.util'
import {
  getCurrentRuntime,
  listRuntimes,
  openOrCreateRuntime,
  RuntimeTmuxService,
  RuntimeTmuxServiceLive,
} from './index'

describe('parseSessionName', () => {
  it('parses project-only session names', () => {
    expect(parseSessionName('alpha')).toEqual({
      sessionName: 'alpha',
      scope: 'project',
      projectName: 'alpha',
      workspaceName: null,
      moduleName: null,
      status: 'open',
    })
  })

  it('parses workspace and module names with canonical separators', () => {
    expect(parseSessionName('alpha~~main~~apps/cli')).toEqual({
      sessionName: 'alpha~~main~~apps/cli',
      scope: 'module',
      projectName: 'alpha',
      workspaceName: 'main',
      moduleName: 'apps/cli',
      status: 'open',
    })
  })

  it('round-trips encoded segments containing separators', () => {
    const sessionName = formatSessionName({
      projectName: 'alpha',
      workspaceName: 'feature/__fixtures:main',
      moduleName: 'apps/__generated.test%ok',
    })

    expect(sessionName).toBe('alpha~~feature/__fixtures~3amain~~apps/__generated~2etest~25ok')
    expect(parseSessionName(sessionName)).toEqual({
      sessionName,
      scope: 'module',
      projectName: 'alpha',
      workspaceName: 'feature/__fixtures:main',
      moduleName: 'apps/__generated.test%ok',
      status: 'open',
    })
  })

  it('ignores invalid session names', () => {
    expect(parseSessionName('alpha~~')).toBeNull()
    expect(parseSessionName('')).toBeNull()
  })
})

describe('session helpers', () => {
  it('finds matching runtimes by semantic target, not exact raw name format', () => {
    expect(
      findMatchingRuntime(
        [
          {
            sessionName: 'alpha~~main~~apps/cli',
            scope: 'module',
            projectName: 'alpha',
            workspaceName: 'main',
            moduleName: 'apps/cli',
            status: 'open',
          },
        ],
        {
          projectName: 'alpha',
          workspaceName: 'main',
          moduleName: 'apps/cli',
        },
      ),
    )?.toMatchObject({ sessionName: 'alpha~~main~~apps/cli' })
  })

  it('formats exact tmux targets', () => {
    expect(formatSessionTarget('alpha~~main')).toBe('=alpha~~main')
  })
})

describe('listRuntimes', () => {
  it('returns provided runtime discovery from the service layer', async () => {
    const discovery: RuntimeDiscovery = {
      runtimes: [
        {
          sessionName: 'alpha~~main',
          scope: 'workspace',
          projectName: 'alpha',
          workspaceName: 'main',
          moduleName: null,
          status: 'open',
        },
      ],
      runtimeIssue: null,
    }

    const layer = Layer.succeed(RuntimeTmuxService, {
      listRuntimes: Effect.succeed(discovery),
      getCurrentRuntime: Effect.succeed(null),
      openOrCreateRuntime: (_target: RuntimeTarget) => Effect.void,
    })

    await expect(
      Effect.runPromise(
        Effect.flatMap(RuntimeTmuxService, (service) => service.listRuntimes).pipe(
          Effect.provide(layer),
        ),
      ),
    ).resolves.toEqual(discovery)
  })

  it('exports a usable live layer symbol', () => {
    expect(RuntimeTmuxServiceLive).toBeDefined()
    expect(listRuntimes).toBeTypeOf('function')
  })
})

describe('getCurrentRuntime', () => {
  it('returns provided current runtime from the service layer', async () => {
    const currentRuntime: CurrentRuntime = {
      sessionName: 'alpha~~main~~apps/cli',
      scope: 'module',
      projectName: 'alpha',
      workspaceName: 'main',
      moduleName: 'apps/cli',
      status: 'open',
    }

    const layer = Layer.succeed(RuntimeTmuxService, {
      listRuntimes: Effect.succeed({ runtimes: [], runtimeIssue: null }),
      getCurrentRuntime: Effect.succeed(currentRuntime),
      openOrCreateRuntime: (_target: RuntimeTarget) => Effect.void,
    })

    await expect(
      Effect.runPromise(
        Effect.flatMap(RuntimeTmuxService, (service) => service.getCurrentRuntime).pipe(
          Effect.provide(layer),
        ),
      ),
    ).resolves.toEqual(currentRuntime)
  })

  it('exports a usable current runtime program symbol', () => {
    expect(getCurrentRuntime).toBeTypeOf('function')
    expect(openOrCreateRuntime).toBeTypeOf('function')
  })
})
