import type { RuntimeTarget } from '@harbr/domain'
import { RuntimeProviderError, RuntimeService } from '@harbr/runtime'
import { Effect, Layer } from 'effect'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TuiServices } from '~/app-context'
import { tuiStore } from '~/store'
import { createAppState } from '~/store/app/app-state'
import { createSurfacesState } from '~/store/surfaces/surfaces-state'
import { openRuntimeForTarget } from './runtime'

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

      await openRuntimeForTarget(services, tuiStore, target, context, {
        persistContext: async (_services, persistedContext) => {
          expect(persistedContext).toEqual(context)
          events.push('persist')
        },
        refresh: async () => {
          events.push('refresh')
        },
      })

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
