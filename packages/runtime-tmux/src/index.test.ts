import { describe, expect, it } from 'vitest'
import { Effect, Layer } from 'effect'
import type { RuntimeTarget } from '@harbr/domain'
import { RuntimeDiscoveryService, RuntimeService } from '@harbr/runtime'

import type {
  CreateRuntimeWindowsResult,
  CurrentRuntime,
  RuntimeDiscovery,
} from './runtime-tmux.types'
import {
  findMatchingRuntime,
  formatSessionName,
  formatSessionTarget,
  parseSessionName,
} from './session-name.util'
import { classifyRuntimeDiscoveryIssue } from './runtime-tmux.discovery'
import {
  getTmuxRuntimeSource,
  RuntimeDiscoveryServiceLive,
  RuntimeServiceLive,
} from './index'

const source = { provider: 'tmux', sourceId: '/tmp/tmux/default' }

function identity(externalId: string) {
  return { displayLabel: externalId, externalId, source }
}

describe('parseSessionName', () => {
  it('parses project-only session names', () => {
    expect(parseSessionName('alpha', source)).toEqual({
      identity: identity('alpha'),
      scope: 'project',
      projectName: 'alpha',
      workspaceName: null,
      moduleName: null,
      status: 'open',
    })
  })

  it('parses workspace and module names with canonical separators', () => {
    expect(parseSessionName('alpha~~main~~apps/cli', source)).toEqual({
      identity: identity('alpha~~main~~apps/cli'),
      scope: 'module',
      projectName: 'alpha',
      workspaceName: 'main',
      moduleName: 'apps/cli',
      status: 'open',
    })
  })

  it('parses root module session names', () => {
    expect(parseSessionName('alpha~~main~~/', source)).toEqual({
      identity: identity('alpha~~main~~/'),
      scope: 'module',
      projectName: 'alpha',
      workspaceName: 'main',
      moduleName: '/',
      status: 'open',
    })
  })

  it('round-trips encoded segments containing separators', () => {
    const sessionName = formatSessionName({
      projectName: 'alpha',
      workspaceName: 'feature/__fixtures:main',
      moduleName: 'apps/__generated.test%ok',
    })

    expect(sessionName).toBe(
      'alpha~~feature/__fixtures~3amain~~apps/__generated~2etest~25ok',
    )
    expect(parseSessionName(sessionName, source)).toEqual({
      identity: identity(sessionName),
      scope: 'module',
      projectName: 'alpha',
      workspaceName: 'feature/__fixtures:main',
      moduleName: 'apps/__generated.test%ok',
      status: 'open',
    })
  })

  it('ignores invalid session names', () => {
    expect(parseSessionName('alpha~~', source)).toBeNull()
    expect(parseSessionName('', source)).toBeNull()
  })
})

describe('getTmuxRuntimeSource', () => {
  it('uses the current tmux socket as the contextual source', () => {
    expect(
      getTmuxRuntimeSource({
        TMUX: '/private/tmp/tmux-501/default,1234,0',
      }),
    ).toEqual({
      provider: 'tmux',
      sourceId: '/private/tmp/tmux-501/default',
    })
  })

  it('uses the default tmux server outside a tmux client', () => {
    expect(getTmuxRuntimeSource({})).toEqual({
      provider: 'tmux',
      sourceId: 'default',
    })
  })
})

describe('session helpers', () => {
  it('finds matching runtimes by semantic target, not exact raw name format', () => {
    expect(
      findMatchingRuntime(
        [
          {
            identity: identity('alpha~~main~~apps/cli'),
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
    )?.toMatchObject({ identity: { externalId: 'alpha~~main~~apps/cli' } })
  })

  it('formats exact tmux targets', () => {
    expect(formatSessionTarget('alpha~~main')).toBe('=alpha~~main')
  })

  it('formats root module session names', () => {
    expect(
      formatSessionName({
        projectName: 'alpha',
        workspaceName: 'main',
        moduleName: '/',
      }),
    ).toBe('alpha~~main~~/')
  })
})

describe('listRuntimes', () => {
  it('classifies harmless tmux discovery failures', () => {
    expect(classifyRuntimeDiscoveryIssue('no server running')).toBeNull()
    expect(
      classifyRuntimeDiscoveryIssue(
        'error connecting to /private/tmp/tmux-501/default (Operation not permitted)',
      ),
    ).toBe('source_unavailable')
    expect(classifyRuntimeDiscoveryIssue('unexpected tmux failure')).toBe(
      undefined,
    )
  })

  it('returns provided runtime discovery from the service layer', async () => {
    const discovery: RuntimeDiscovery = {
      runtimes: [
        {
          identity: identity('alpha~~main'),
          scope: 'workspace',
          projectName: 'alpha',
          workspaceName: 'main',
          moduleName: null,
          status: 'open',
        },
      ],
      runtimeIssue: null,
      source,
    }

    const layer = Layer.succeed(RuntimeDiscoveryService, {
      listRuntimes: Effect.succeed(discovery),
    })

    await expect(
      Effect.runPromise(
        Effect.flatMap(
          RuntimeDiscoveryService,
          (service) => service.listRuntimes,
        ).pipe(Effect.provide(layer)),
      ),
    ).resolves.toEqual(discovery)
  })

  it('exports a usable live layer symbol', () => {
    expect(RuntimeDiscoveryServiceLive).toBeDefined()
  })
})

describe('getCurrentRuntime', () => {
  it('returns provided current runtime from the service layer', async () => {
    const currentRuntime: CurrentRuntime = {
      identity: identity('alpha~~main~~apps/cli'),
      scope: 'module',
      projectName: 'alpha',
      workspaceName: 'main',
      moduleName: 'apps/cli',
      status: 'open',
    }

    const layer = Layer.succeed(RuntimeService, {
      closeRuntime: () => Effect.void,
      createRuntimeWindows: (_input) =>
        Effect.succeed<CreateRuntimeWindowsResult>({
          createdWindowNames: [],
          skippedWindowNames: [],
        }),
      getCurrentRuntime: Effect.succeed(currentRuntime),
      openOrCreateRuntime: (_target: RuntimeTarget) => Effect.void,
      source,
    })

    await expect(
      Effect.runPromise(
        Effect.flatMap(
          RuntimeService,
          (service) => service.getCurrentRuntime,
        ).pipe(Effect.provide(layer)),
      ),
    ).resolves.toEqual(currentRuntime)
  })

  it('exports a usable live service tag', () => {
    expect(RuntimeServiceLive).toBeDefined()
  })
})
