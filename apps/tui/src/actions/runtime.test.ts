import type {
  ResolvedContextTarget,
  RuntimeAttachment,
  RuntimeIdentity,
  RuntimeTarget,
} from '@harbr/domain'
import { RuntimeProviderError, RuntimeService } from '@harbr/runtime'
import { Effect, Layer } from 'effect'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TuiServices } from '~/app-context'
import { tuiStore } from '~/store'
import { createAppState } from '~/store/app/app-state'
import { createSurfacesState } from '~/store/surfaces/surfaces-state'
import type { ProjectRow } from '~/types/rows'
import { closeActiveRuntime, openRuntimeForTarget } from './runtime'

const source = {
  provider: 'herdr',
  sourceId: '/tmp/herdr/session.sock',
} as const

describe('openRuntimeForTarget', () => {
  beforeEach(() => {
    tuiStore.setState((state) => ({
      ...state,
      app: { ...createAppState(), isLoading: false },
      surfaces: {
        ...createSurfacesState(),
        surface: { kind: 'actions', route: 'browse' },
      },
    }))
  })

  it.each([
    ['project', runtimeTarget('project'), { projectId: 'project-alpha' }],
    [
      'workspace',
      runtimeTarget('workspace'),
      { projectId: 'project-alpha', workspaceId: 'workspace-feature' },
    ],
    [
      'module',
      runtimeTarget('module'),
      {
        projectId: 'project-alpha',
        workspaceId: 'workspace-feature',
        moduleId: 'module-cli',
      },
    ],
  ] as const)(
    'persists, refreshes, and closes after a successful %s jump',
    async (_scope, target, context) => {
      const events: string[] = []
      const services = testServices(
        Effect.sync(() => events.push(`open:${target.cwd}`)),
        events,
      )

      await openRuntimeForTarget(
        services,
        tuiStore,
        target,
        context,
        undefined,
        {
          persistContext: async (_services, persistedContext) => {
            expect(persistedContext).toEqual(context)
            events.push('persist')
          },
          refresh: async () => {
            events.push('refresh')
          },
        },
      )

      expect(events).toEqual([
        `open:${target.cwd}`,
        'persist',
        'refresh',
        'shutdown',
      ])
      expect(tuiStore.getState().surfaces.surface).toEqual({ kind: 'browser' })
      expect(tuiStore.getState().app.isLoading).toBe(false)
      expect(tuiStore.getState().app.notice).toBeNull()
    },
  )

  it('keeps the catalogue and popup usable when the provider fails', async () => {
    const events: string[] = []
    const projectRows = [{ id: 'keep-me' }] as never
    tuiStore.setState((state) => ({
      data: { ...state.data, projectRows },
    }))
    const services = testServices(
      Effect.fail(
        new RuntimeProviderError({
          message: 'Herdr session is unavailable',
          operation: 'openOrCreateRuntime',
          provider: 'herdr',
        }),
      ),
      events,
    )
    const persist = vi.fn()
    const refresh = vi.fn()

    await openRuntimeForTarget(
      services,
      tuiStore,
      runtimeTarget('project'),
      { projectId: 'project-alpha' },
      undefined,
      { persistContext: persist, refresh },
    )

    expect(persist).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
    expect(events).toEqual([])
    expect(tuiStore.getState().data.projectRows).toBe(projectRows)
    expect(tuiStore.getState().surfaces.surface).toEqual({
      kind: 'actions',
      route: 'browse',
    })
    expect(tuiStore.getState().app).toMatchObject({
      isLoading: false,
      notice: { level: 'error', message: 'Herdr session is unavailable' },
    })
  })
})

describe('closeActiveRuntime', () => {
  beforeEach(() => {
    tuiStore.setState((state) => ({
      ...state,
      app: { ...createAppState(), isLoading: false },
      surfaces: {
        ...createSurfacesState(),
        surface: { kind: 'actions', route: 'active' },
      },
    }))
  })

  it('closes by provider-neutral identity and refreshes the current source', async () => {
    const events: string[] = []
    const targetIdentity = identity('workspace-module')
    const services = closeTestServices((receivedIdentity) =>
      Effect.sync(() => {
        expect(receivedIdentity).toEqual(targetIdentity)
        events.push('close')
      }),
    )

    await closeActiveRuntime(services, tuiStore, runtimeRow(targetIdentity), {
      refresh: async () => {
        events.push('refresh')
      },
    })

    expect(events).toEqual(['close', 'refresh'])
    expect(tuiStore.getState().surfaces.surface).toEqual({ kind: 'browser' })
    expect(tuiStore.getState().app).toMatchObject({
      isLoading: false,
      notice: null,
    })
  })

  it('rejects self-close using provider, source, and external identity', async () => {
    const close = vi.fn(() => Effect.void)
    const refresh = vi.fn()
    const currentIdentity = identity('workspace-current')
    tuiStore.setState((state) => ({
      app: {
        ...state.app,
        currentRuntime: { identity: currentIdentity, status: 'open' },
      },
    }))

    await closeActiveRuntime(
      closeTestServices(close),
      tuiStore,
      runtimeRow({ ...currentIdentity, displayLabel: 'Renamed workspace' }),
      { refresh },
    )

    expect(close).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
    expect(tuiStore.getState().surfaces.surface).toEqual({
      kind: 'actions',
      route: 'active',
    })
    expect(tuiStore.getState().app).toMatchObject({
      isLoading: false,
      notice: { level: 'warning', message: 'Cannot close current workspace' },
    })
  })

  it('keeps the catalogue and actions menu recoverable on provider failure', async () => {
    const projectRows = [{ id: 'keep-me' }] as never
    const refresh = vi.fn()
    tuiStore.setState((state) => ({
      data: { ...state.data, projectRows },
    }))

    await closeActiveRuntime(
      closeTestServices(() =>
        Effect.fail(
          new RuntimeProviderError({
            message: 'Herdr could not close this workspace: workspace is busy',
            operation: 'closeRuntime',
            provider: 'herdr',
          }),
        ),
      ),
      tuiStore,
      runtimeRow(identity('workspace-module')),
      { refresh },
    )

    expect(refresh).not.toHaveBeenCalled()
    expect(tuiStore.getState().data.projectRows).toBe(projectRows)
    expect(tuiStore.getState().surfaces.surface).toEqual({
      kind: 'actions',
      route: 'active',
    })
    expect(tuiStore.getState().app).toMatchObject({
      isLoading: false,
      notice: {
        level: 'error',
        message: 'Herdr could not close this workspace: workspace is busy',
      },
    })
  })

  it('preserves tmux close behavior through the provider-neutral action', async () => {
    const close = vi.fn(() => Effect.void)
    const tmuxIdentity = identity('alpha~~feature', {
      provider: 'tmux',
      sourceId: '/tmp/tmux/default',
    })

    await closeActiveRuntime(
      closeTestServices(close, tmuxIdentity.source),
      tuiStore,
      runtimeRow(tmuxIdentity),
      { refresh: async () => undefined },
    )

    expect(close).toHaveBeenCalledWith(tmuxIdentity)
  })
})

function testServices(
  open: Effect.Effect<unknown, RuntimeProviderError>,
  events: string[],
) {
  const layer = Layer.succeed(RuntimeService, {
    closeRuntime: () => Effect.void,
    createRuntimeWindows: () =>
      Effect.succeed({ createdWindowNames: [], skippedWindowNames: [] }),
    getCurrentRuntime: Effect.succeed(null),
    openOrCreateRuntime: () => open.pipe(Effect.asVoid),
    source,
  })

  return {
    effectRuntime: {
      runPromise: <A, E>(effect: Effect.Effect<A, E, RuntimeService>) =>
        Effect.runPromise(effect.pipe(Effect.provide(layer))),
    },
    options: {},
    renderer: {},
    shutdown: async () => {
      events.push('shutdown')
    },
  } as unknown as TuiServices
}

function closeTestServices(
  close: (
    identity: RuntimeIdentity,
  ) => Effect.Effect<void, RuntimeProviderError>,
  runtimeSource: RuntimeIdentity['source'] = source,
) {
  const layer = Layer.succeed(RuntimeService, {
    closeRuntime: close,
    createRuntimeWindows: () =>
      Effect.succeed({ createdWindowNames: [], skippedWindowNames: [] }),
    getCurrentRuntime: Effect.succeed(null),
    openOrCreateRuntime: () => Effect.void,
    source: runtimeSource,
  })

  return {
    effectRuntime: {
      runPromise: <A, E>(effect: Effect.Effect<A, E, RuntimeService>) =>
        Effect.runPromise(effect.pipe(Effect.provide(layer))),
    },
    options: {},
    renderer: {},
    shutdown: async () => undefined,
  } as unknown as TuiServices
}

function identity(
  externalId: string,
  runtimeSource: RuntimeIdentity['source'] = source,
): RuntimeIdentity {
  return { displayLabel: externalId, externalId, source: runtimeSource }
}

function runtimeRow(targetIdentity: RuntimeIdentity): ProjectRow & {
  runtime: RuntimeAttachment
} {
  return {
    activeSessionCount: 1,
    hasModules: false,
    hasWorkspaces: false,
    id: 'project-alpha',
    isActive: true,
    isCurrent: false,
    kind: 'project',
    label: 'alpha',
    projectId: 'project-alpha',
    repoPath: '/work/alpha',
    runtime: { identity: targetIdentity, status: 'open' },
    target: {
      breadcrumb: 'alpha',
      context: { projectId: 'project-alpha' },
      label: 'alpha',
      runtimeTarget: runtimeTarget('project'),
      scope: 'project',
    } satisfies ResolvedContextTarget,
  }
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
