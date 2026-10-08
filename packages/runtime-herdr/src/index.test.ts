import type { RuntimeIdentity, RuntimeTarget } from '@harbr/domain'
import { RuntimeService } from '@harbr/runtime'
import { runtimeLayoutTargetFixture, runtimeLayoutWindowsFixture } from '@harbr/test-utils'
import { Effect, Layer } from 'effect'
import { describe, expect, it } from 'vitest'

import { HerdrClient, HerdrUnavailable, type HerdrClientApi } from './herdr.client'
import { formatHerdrWorkspaceLabel } from './herdr.label'
import { normalizeHerdrSnapshot } from './herdr.snapshot'
import { getHerdrRuntimeSource } from './index'
import { RuntimeServiceLayer } from './services/runtime-herdr.live'

const source = getHerdrRuntimeSource()

describe('getHerdrRuntimeSource', () => {
  it('uses the current Herdr socket as the contextual source', () => {
    expect(
      getHerdrRuntimeSource({
        HERDR_SOCKET_PATH: '/tmp/herdr/session.sock',
      }),
    ).toEqual({
      provider: 'herdr',
      sourceId: '/tmp/herdr/session.sock',
    })
  })
})

describe('normalizeHerdrSnapshot', () => {
  it('normalizes workspace IDs, labels, worktrees, and focused workspace', () => {
    const result = normalizeHerdrSnapshot(snapshotFixture(), source, 'workspace-module')

    expect(result).toEqual({
      currentRuntime: {
        identity: {
          displayLabel: 'CLI',
          externalId: 'workspace-module',
          source,
        },
        status: 'open',
      },
      runtimes: [
        {
          contextPath: '/work/alpha-main',
          identity: {
            displayLabel: 'Alpha main',
            externalId: 'workspace-main',
            source,
          },
          status: 'open',
        },
        {
          contextPath: '/work/alpha-main/apps/cli',
          identity: {
            displayLabel: 'CLI',
            externalId: 'workspace-module',
            source,
          },
          status: 'open',
        },
      ],
    })
  })

  it('uses the structured focused workspace when launch context is absent', () => {
    expect(normalizeHerdrSnapshot(snapshotFixture(), source).currentRuntime).toMatchObject({
      identity: { externalId: 'workspace-main' },
    })
  })

  it('rejects presentation text instead of scraping it', () => {
    expect(() => normalizeHerdrSnapshot('Alpha main', source)).toThrow('not an object')
  })
})

describe('RuntimeService', () => {
  it('applies the shared logical layout as idempotent Herdr tabs and panes', async () => {
    const commands: string[][] = []
    const layer = layoutRuntimeLayer(commands)

    const first = await createRuntimeWindows(layer, runtimeLayoutWindowsFixture)
    const second = await createRuntimeWindows(layer, runtimeLayoutWindowsFixture)

    expect(first).toEqual({
      createdWindowNames: ['Editor', 'Logs'],
      skippedWindowNames: [],
    })
    expect(second).toEqual({
      createdWindowNames: [],
      skippedWindowNames: ['Editor', 'Logs'],
    })
    expect(commands).toEqual([
      ['api', 'snapshot'],
      ['tab', 'rename', 'tab-initial', 'Editor'],
      ['pane', 'rename', 'pane-initial', 'Code'],
      ['pane', 'run', 'pane-initial', 'nvim .'],
      [
        'pane',
        'split',
        'pane-initial',
        '--direction',
        'right',
        '--cwd',
        '/work/alpha-feature/apps/cli',
        '--no-focus',
      ],
      ['pane', 'rename', 'pane-split-1', 'Tests'],
      ['pane', 'run', 'pane-split-1', 'bun run test'],
      ['pane', 'run', 'pane-split-1', 'bun run lint'],
      [
        'tab',
        'create',
        '--workspace',
        'workspace-feature',
        '--cwd',
        '/var/log/alpha',
        '--label',
        'Logs',
        '--no-focus',
      ],
      ['pane', 'rename', 'pane-logs', 'Server logs'],
      ['workspace', 'focus', 'workspace-feature'],
      ['api', 'snapshot'],
    ])
  })

  it('removes an unused automatic initial tab after creating the configured tab', async () => {
    const commands: string[][] = []
    const layer = layoutRuntimeLayer(commands)

    const result = await createRuntimeWindows(layer, runtimeLayoutWindowsFixture.slice(1))

    expect(result.createdWindowNames).toEqual(['Logs'])
    expect(commands).toContainEqual(['tab', 'close', 'tab-initial'])
  })

  it('creates a missing workspace before applying its layout', async () => {
    const commands: string[][] = []
    const layer = layoutRuntimeLayer(commands, false)

    const result = await createRuntimeWindows(layer, runtimeLayoutWindowsFixture.slice(0, 1))

    expect(result.createdWindowNames).toEqual(['Editor'])
    expect(commands.slice(0, 3)).toEqual([
      ['api', 'snapshot'],
      [
        'workspace',
        'create',
        '--cwd',
        '/work/alpha-feature',
        '--label',
        'alpha › feature',
        '--no-focus',
      ],
      ['api', 'snapshot'],
    ])
  })

  it('returns a structured provider error when layout application fails', async () => {
    const snapshot = layoutSnapshotFixture()
    const client = Layer.succeed(HerdrClient, {
      execute: (args) =>
        args[0] === 'api'
          ? Effect.succeed(JSON.stringify(snapshot))
          : Effect.fail(new HerdrUnavailable('tab creation failed', false)),
    } satisfies HerdrClientApi)
    const layer = RuntimeServiceLayer.pipe(Layer.provide(client))

    await expect(createRuntimeWindows(layer, runtimeLayoutWindowsFixture)).rejects.toThrow(
      'Herdr could not apply this layout: tab creation failed',
    )
  })

  it('closes a workspace by its stable Herdr ID', async () => {
    const commands: string[][] = []
    const layer = runtimeLayer(commands, snapshotFixture())

    await closeRuntime(layer, identity('workspace-module'))

    expect(commands).toEqual([['workspace', 'close', 'workspace-module']])
  })

  it('returns an actionable error when Herdr cannot close a workspace', async () => {
    const client = Layer.succeed(HerdrClient, {
      execute: () => Effect.fail(new HerdrUnavailable('workspace is busy', false)),
    } satisfies HerdrClientApi)
    const layer = RuntimeServiceLayer.pipe(Layer.provide(client))

    const result = closeRuntime(layer, identity('workspace-module'))

    await expect(result).rejects.toThrow('Herdr could not close this workspace: workspace is busy')
  })

  it('refuses to close a workspace from another runtime source', async () => {
    const commands: string[][] = []
    const layer = runtimeLayer(commands, snapshotFixture())

    const result = closeRuntime(layer, {
      ...identity('workspace-module'),
      source: { provider: 'herdr', sourceId: `${source.sourceId}:other` },
    })

    await expect(result).rejects.toThrow('Runtime does not belong to the active Herdr source')
    expect(commands).toEqual([])
  })

  it('focuses an existing workspace by its stable Herdr ID', async () => {
    const commands: string[][] = []
    const target = {
      ...runtimeTarget('module'),
      cwd: '/work/alpha-main/apps/cli',
    }
    const layer = runtimeLayer(commands, snapshotFixture())

    await openRuntime(layer, target, identity('workspace-module'))

    expect(commands).toEqual([
      ['api', 'snapshot'],
      ['workspace', 'focus', 'workspace-module'],
    ])
  })

  it('focuses a supplied workspace ID even when its pane cwd has changed', async () => {
    const commands: string[][] = []
    const target = runtimeTarget('project')
    const layer = runtimeLayer(commands, snapshotFixture())

    await openRuntime(layer, target, identity('workspace-module'))

    expect(commands).toEqual([
      ['api', 'snapshot'],
      ['workspace', 'focus', 'workspace-module'],
    ])
  })

  it('does not reuse a workspace by pane cwd without a bound identity', async () => {
    const commands: string[][] = []
    const target = {
      ...runtimeTarget('module'),
      cwd: '/work/alpha-main/apps/cli',
    }
    const layer = runtimeLayer(commands, snapshotFixture())

    await openRuntime(layer, target)

    expect(commands).toEqual([
      ['api', 'snapshot'],
      [
        'workspace',
        'create',
        '--cwd',
        '/work/alpha-main/apps/cli',
        '--label',
        'alpha › feature › cli',
        '--focus',
      ],
    ])
  })

  it.each([
    ['project', runtimeTarget('project'), 'alpha'],
    ['workspace', runtimeTarget('workspace'), 'alpha › feature'],
    ['module', runtimeTarget('module'), 'alpha › feature › cli'],
  ] as const)(
    'creates and focuses a missing %s runtime with its resolved cwd and label',
    async (_scope, target, label) => {
      const commands: string[][] = []
      const layer = runtimeLayer(commands, emptySnapshotFixture())

      await openRuntime(layer, target)

      expect(commands).toEqual([
        ['api', 'snapshot'],
        ['workspace', 'create', '--cwd', target.cwd, '--label', label, '--focus'],
      ])
      expect(formatHerdrWorkspaceLabel(target)).toBe(label)
    },
  )

  it('returns an actionable provider error without attempting creation', async () => {
    const commands: string[][] = []
    const client = Layer.succeed(HerdrClient, {
      execute: (args) =>
        Effect.sync(() => commands.push([...args])).pipe(
          Effect.andThen(Effect.fail(new HerdrUnavailable('session unavailable', false))),
        ),
    } satisfies HerdrClientApi)
    const layer = RuntimeServiceLayer.pipe(Layer.provide(client))

    const result = Effect.runPromise(
      Effect.gen(function* () {
        const runtime = yield* RuntimeService
        yield* runtime.openOrCreateRuntime(runtimeTarget('project'))
      }).pipe(Effect.provide(layer)),
    )

    await expect(result).rejects.toThrow('Herdr could not open this context: session unavailable')
    expect(commands).toEqual([['api', 'snapshot']])
  })
})

async function openRuntime(
  layer: Layer.Layer<RuntimeService>,
  target: RuntimeTarget,
  targetIdentity?: RuntimeIdentity,
) {
  await Effect.runPromise(
    Effect.gen(function* () {
      const runtime = yield* RuntimeService
      yield* runtime.openOrCreateRuntime(target, targetIdentity)
    }).pipe(Effect.provide(layer)),
  )
}

async function closeRuntime(layer: Layer.Layer<RuntimeService>, targetIdentity: RuntimeIdentity) {
  await Effect.runPromise(
    Effect.gen(function* () {
      const runtime = yield* RuntimeService
      yield* runtime.closeRuntime(targetIdentity)
    }).pipe(Effect.provide(layer)),
  )
}

async function createRuntimeWindows(
  layer: Layer.Layer<RuntimeService>,
  windows: typeof runtimeLayoutWindowsFixture,
) {
  return Effect.runPromise(
    Effect.gen(function* () {
      const runtime = yield* RuntimeService
      return yield* runtime.createRuntimeWindows({
        target: runtimeLayoutTargetFixture,
        windows,
      })
    }).pipe(Effect.provide(layer)),
  )
}

function identity(externalId: string): RuntimeIdentity {
  return { displayLabel: externalId, externalId, source }
}

function runtimeLayer(commands: string[][], snapshot: unknown) {
  const client = Layer.succeed(HerdrClient, {
    execute: (args) =>
      Effect.sync(() => {
        commands.push([...args])
        return args[0] === 'api' ? JSON.stringify(snapshot) : '{}'
      }),
  } satisfies HerdrClientApi)

  return RuntimeServiceLayer.pipe(Layer.provide(client))
}

function layoutRuntimeLayer(commands: string[][], hasWorkspace = true) {
  const workspaceId = 'workspace-feature'
  const tabs: Array<{
    focused: boolean
    label: string
    pane_count: number
    tab_id: string
    workspace_id: string
  }> = []
  const panes: Array<{
    cwd: string
    focused: boolean
    label: string | null
    pane_id: string
    tab_id: string
    workspace_id: string
  }> = []

  if (hasWorkspace) {
    addInitialSurface()
  }

  const client = Layer.succeed(HerdrClient, {
    execute: (args) =>
      Effect.sync(() => {
        commands.push([...args])

        if (args[0] === 'api') {
          return JSON.stringify(layoutSnapshotFixture(tabs, panes))
        }

        if (args[0] === 'workspace' && args[1] === 'create') {
          addInitialSurface()
          return creationResponse('workspace-feature', 'tab-initial', 'pane-initial')
        }

        if (args[0] === 'tab' && args[1] === 'rename') {
          const tab = tabs.find((candidate) => candidate.tab_id === args[2])
          if (tab) tab.label = args[3] ?? ''
          return '{}'
        }

        if (args[0] === 'tab' && args[1] === 'create') {
          const label = args[args.indexOf('--label') + 1] ?? 'tab'
          const slug = label.toLowerCase()
          const tabId = `tab-${slug}`
          const paneId = `pane-${slug}`
          tabs.push({
            focused: false,
            label,
            pane_count: 1,
            tab_id: tabId,
            workspace_id: workspaceId,
          })
          panes.push({
            cwd: args[args.indexOf('--cwd') + 1] ?? '',
            focused: false,
            label: null,
            pane_id: paneId,
            tab_id: tabId,
            workspace_id: workspaceId,
          })
          return creationResponse(undefined, tabId, paneId)
        }

        if (args[0] === 'tab' && args[1] === 'close') {
          const tabIndex = tabs.findIndex((tab) => tab.tab_id === args[2])
          if (tabIndex >= 0) tabs.splice(tabIndex, 1)
          const remainingPanes = panes.filter((pane) => pane.tab_id !== args[2])
          panes.splice(0, panes.length, ...remainingPanes)
          return '{}'
        }

        if (args[0] === 'pane' && args[1] === 'split') {
          const target = panes.find((pane) => pane.pane_id === args[2])
          const paneId = `pane-split-${panes.length}`
          panes.push({
            cwd: args[args.indexOf('--cwd') + 1] ?? '',
            focused: false,
            label: null,
            pane_id: paneId,
            tab_id: target?.tab_id ?? '',
            workspace_id: workspaceId,
          })
          return JSON.stringify({ result: { pane: { pane_id: paneId } } })
        }

        if (args[0] === 'pane' && args[1] === 'rename') {
          const pane = panes.find((candidate) => candidate.pane_id === args[2])
          if (pane) pane.label = args[3] ?? ''
        }

        return '{}'
      }),
  } satisfies HerdrClientApi)

  return RuntimeServiceLayer.pipe(Layer.provide(client))

  function addInitialSurface() {
    tabs.push({
      focused: true,
      label: 'shell',
      pane_count: 1,
      tab_id: 'tab-initial',
      workspace_id: workspaceId,
    })
    panes.push({
      cwd: runtimeLayoutTargetFixture.cwd,
      focused: true,
      label: null,
      pane_id: 'pane-initial',
      tab_id: 'tab-initial',
      workspace_id: workspaceId,
    })
  }
}

function layoutSnapshotFixture(
  tabs: readonly unknown[] = [
    {
      focused: true,
      label: 'shell',
      pane_count: 1,
      tab_id: 'tab-initial',
      workspace_id: 'workspace-feature',
    },
  ],
  panes: readonly unknown[] = [
    {
      cwd: runtimeLayoutTargetFixture.cwd,
      focused: true,
      label: null,
      pane_id: 'pane-initial',
      tab_id: 'tab-initial',
      workspace_id: 'workspace-feature',
    },
  ],
) {
  return {
    result: {
      type: 'session_snapshot',
      snapshot: {
        focused_workspace_id: 'workspace-feature',
        panes,
        tabs,
        workspaces:
          tabs.length > 0
            ? [
                {
                  focused: true,
                  label: 'Alpha feature',
                  workspace_id: 'workspace-feature',
                  worktree: {
                    checkout_path: runtimeLayoutTargetFixture.cwd,
                  },
                },
              ]
            : [],
      },
    },
  }
}

function creationResponse(workspaceId: string | undefined, tabId: string, paneId: string) {
  return JSON.stringify({
    result: {
      root_pane: { pane_id: paneId },
      tab: { tab_id: tabId },
      ...(workspaceId ? { workspace: { workspace_id: workspaceId } } : {}),
    },
  })
}

function runtimeTarget(scope: 'module' | 'project' | 'workspace') {
  return {
    cwd:
      scope === 'project'
        ? '/work/alpha'
        : scope === 'workspace'
          ? '/work/alpha-feature'
          : '/work/alpha-feature/apps/cli',
    moduleName: scope === 'module' ? 'cli' : null,
    projectName: 'alpha',
    workspaceName: scope === 'project' ? null : 'feature',
  } satisfies RuntimeTarget
}

function emptySnapshotFixture() {
  return {
    id: 'cli:api:snapshot',
    result: {
      type: 'session_snapshot',
      snapshot: {
        focused_workspace_id: null,
        workspaces: [],
        panes: [],
      },
    },
  }
}

function snapshotFixture() {
  return {
    id: 'cli:api:snapshot',
    result: {
      type: 'session_snapshot',
      snapshot: {
        version: '0.8.2',
        protocol: 20,
        focused_workspace_id: 'workspace-main',
        workspaces: [
          {
            workspace_id: 'workspace-main',
            label: 'Alpha main',
            focused: true,
            worktree: {
              checkout_path: '/work/alpha-main',
              repo_root: '/work/alpha.git',
              repo_key: 'alpha',
              repo_name: 'alpha',
              is_linked_worktree: true,
            },
          },
          {
            workspace_id: 'workspace-module',
            label: 'CLI',
            focused: false,
            worktree: null,
          },
        ],
        panes: [
          {
            workspace_id: 'workspace-main',
            cwd: '/ignored/because/worktree/wins',
            focused: true,
          },
          {
            workspace_id: 'workspace-module',
            cwd: '/work/alpha-main/apps/cli',
            focused: true,
          },
        ],
        tabs: [],
        layouts: [],
        agents: [],
      },
    },
  }
}
