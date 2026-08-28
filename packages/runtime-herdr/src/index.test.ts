import type { RuntimeTarget } from '@harbr/domain'
import { RuntimeService } from '@harbr/runtime'
import { Effect, Layer } from 'effect'
import { describe, expect, it } from 'vitest'

import {
  HerdrClient,
  HerdrUnavailable,
  type HerdrClientApi,
} from './herdr.client'
import { formatHerdrWorkspaceLabel } from './herdr.label'
import { normalizeHerdrSnapshot } from './herdr.snapshot'
import { getHerdrRuntimeSource } from './index'
import { RuntimeServiceLayer } from './services/runtime-herdr.live'

const source = { provider: 'herdr', sourceId: '/tmp/herdr/session.sock' }

describe('getHerdrRuntimeSource', () => {
  it('uses the current Herdr socket as the contextual source', () => {
    expect(
      getHerdrRuntimeSource({ HERDR_SOCKET_PATH: source.sourceId }),
    ).toEqual(source)
  })
})

describe('normalizeHerdrSnapshot', () => {
  it('normalizes workspace IDs, labels, worktrees, and focused workspace', () => {
    const result = normalizeHerdrSnapshot(
      snapshotFixture(),
      source,
      'workspace-module',
    )

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
    expect(
      normalizeHerdrSnapshot(snapshotFixture(), source).currentRuntime,
    ).toMatchObject({ identity: { externalId: 'workspace-main' } })
  })

  it('rejects presentation text instead of scraping it', () => {
    expect(() => normalizeHerdrSnapshot('Alpha main', source)).toThrow(
      'not an object',
    )
  })
})

describe('RuntimeService', () => {
  it('focuses an existing workspace by its stable Herdr ID', async () => {
    const commands: string[][] = []
    const target = {
      ...runtimeTarget('module'),
      cwd: '/work/alpha-main/apps/cli',
    }
    const layer = runtimeLayer(commands, snapshotFixture())

    await openRuntime(layer, target)

    expect(commands).toEqual([
      ['api', 'snapshot'],
      ['workspace', 'focus', 'workspace-module'],
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
        [
          'workspace',
          'create',
          '--cwd',
          target.cwd,
          '--label',
          label,
          '--focus',
        ],
      ])
      expect(formatHerdrWorkspaceLabel(target)).toBe(label)
    },
  )

  it('returns an actionable provider error without attempting creation', async () => {
    const commands: string[][] = []
    const client = Layer.succeed(HerdrClient, {
      execute: (args) =>
        Effect.sync(() => commands.push([...args])).pipe(
          Effect.andThen(
            Effect.fail(new HerdrUnavailable('session unavailable', false)),
          ),
        ),
    } satisfies HerdrClientApi)
    const layer = RuntimeServiceLayer.pipe(Layer.provide(client))

    const result = Effect.runPromise(
      Effect.gen(function* () {
        const runtime = yield* RuntimeService
        yield* runtime.openOrCreateRuntime(runtimeTarget('project'))
      }).pipe(Effect.provide(layer)),
    )

    await expect(result).rejects.toThrow(
      'Herdr could not open this context: session unavailable',
    )
    expect(commands).toEqual([['api', 'snapshot']])
  })
})

async function openRuntime(
  layer: Layer.Layer<RuntimeService>,
  target: RuntimeTarget,
) {
  await Effect.runPromise(
    Effect.gen(function* () {
      const runtime = yield* RuntimeService
      yield* runtime.openOrCreateRuntime(target)
    }).pipe(Effect.provide(layer)),
  )
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
