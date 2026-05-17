import { describe, expect, it } from 'vitest'
import { Effect, Layer } from 'effect'

import type { CurrentRuntime, RuntimeDiscovery } from './runtime-tmux.types'
import { parseSessionName } from './session-name.util'
import {
  getCurrentRuntime,
  listRuntimes,
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

  it('parses workspace and module names with double underscore separators', () => {
    expect(parseSessionName('alpha__main__apps/cli')).toEqual({
      sessionName: 'alpha__main__apps/cli',
      scope: 'module',
      projectName: 'alpha',
      workspaceName: 'main',
      moduleName: 'apps/cli',
      status: 'open',
    })
  })

  it('parses slash session names and preserves module path rest', () => {
    expect(parseSessionName('alpha/main/apps/cli')).toEqual({
      sessionName: 'alpha/main/apps/cli',
      scope: 'module',
      projectName: 'alpha',
      workspaceName: 'main',
      moduleName: 'apps/cli',
      status: 'open',
    })
  })

  it('ignores invalid session names', () => {
    expect(parseSessionName('alpha__')).toBeNull()
    expect(parseSessionName('')).toBeNull()
  })
})

describe('listRuntimes', () => {
  it('returns provided runtime discovery from the service layer', async () => {
    const discovery: RuntimeDiscovery = {
      runtimes: [
        {
          sessionName: 'alpha__main',
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
      sessionName: 'alpha/main/apps/cli',
      scope: 'module',
      projectName: 'alpha',
      workspaceName: 'main',
      moduleName: 'apps/cli',
      status: 'open',
    }

    const layer = Layer.succeed(RuntimeTmuxService, {
      listRuntimes: Effect.succeed({ runtimes: [], runtimeIssue: null }),
      getCurrentRuntime: Effect.succeed(currentRuntime),
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
  })
})
