import type { ResolvedContextTarget } from '@harbr/domain'
import { RuntimeProviderError, RuntimeService } from '@harbr/runtime'
import {
  runtimeLayoutTargetFixture,
  runtimeLayoutWindowsFixture,
} from '@harbr/test-utils'
import { Effect, Layer } from 'effect'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TuiServices } from '~/app-context'
import { tuiStore } from '~/store'
import { createAppState } from '~/store/app/app-state'
import { createSurfacesState } from '~/store/surfaces/surfaces-state'
import { createWindowsForContext } from './windows'

const source = {
  provider: 'herdr',
  sourceId: '/tmp/herdr/session.sock',
} as const

const target = {
  breadcrumb: 'alpha › feature',
  context: { projectId: 'project-alpha', workspaceId: 'workspace-feature' },
  label: 'feature',
  runtimeTarget: runtimeLayoutTargetFixture,
  scope: 'workspace',
} satisfies ResolvedContextTarget

describe('createWindowsForContext', () => {
  beforeEach(() => {
    tuiStore.setState((state) => ({
      ...state,
      app: { ...createAppState(), isLoading: false },
      surfaces: {
        ...createSurfacesState(),
        surface: { kind: 'window-picker', route: 'browse', target },
      },
    }))
  })

  it('persists, refreshes, closes, and shuts down after a successful layout', async () => {
    const events: string[] = []
    const services = testServices(
      Effect.succeed({
        createdWindowNames: ['Editor'],
        skippedWindowNames: ['Logs'],
      }),
      events,
    )

    await createWindowsForContext(
      services,
      tuiStore,
      target,
      runtimeLayoutWindowsFixture,
      {
        persistContext: async () => {
          events.push('persist')
        },
        refresh: async () => {
          events.push('refresh')
        },
      },
    )

    expect(events).toEqual(['create', 'persist', 'refresh', 'shutdown'])
    expect(tuiStore.getState().surfaces.surface).toEqual({ kind: 'browser' })
    expect(tuiStore.getState().app.isLoading).toBe(false)
  })

  it('refreshes and keeps the picker open when the layout already exists', async () => {
    const events: string[] = []
    const services = testServices(
      Effect.succeed({
        createdWindowNames: [],
        skippedWindowNames: ['Editor', 'Logs'],
      }),
      events,
    )

    await createWindowsForContext(
      services,
      tuiStore,
      target,
      runtimeLayoutWindowsFixture,
      {
        persistContext: async () => {
          events.push('persist')
        },
        refresh: async () => {
          events.push('refresh')
        },
      },
    )

    expect(events).toEqual(['create', 'persist', 'refresh'])
    expect(tuiStore.getState().surfaces.surface.kind).toBe('window-picker')
    expect(tuiStore.getState().app).toMatchObject({
      isLoading: false,
      notice: { level: 'warning', message: 'Windows already exist' },
    })
  })

  it('refreshes and leaves the picker recoverable after provider failure', async () => {
    const events: string[] = []
    const persist = vi.fn()
    const services = testServices(
      Effect.fail(
        new RuntimeProviderError({
          message: 'Herdr could not apply this layout: tab creation failed',
          operation: 'createRuntimeWindows',
          provider: 'herdr',
        }),
      ),
      events,
    )

    await createWindowsForContext(
      services,
      tuiStore,
      target,
      runtimeLayoutWindowsFixture,
      {
        persistContext: persist,
        refresh: async () => {
          events.push('refresh')
        },
      },
    )

    expect(persist).not.toHaveBeenCalled()
    expect(events).toEqual(['create', 'refresh'])
    expect(tuiStore.getState().surfaces.surface.kind).toBe('window-picker')
    expect(tuiStore.getState().app).toMatchObject({
      isLoading: false,
      notice: {
        level: 'error',
        message: 'Herdr could not apply this layout: tab creation failed',
      },
    })
  })
})

function testServices(
  create: Effect.Effect<
    { createdWindowNames: string[]; skippedWindowNames: string[] },
    RuntimeProviderError
  >,
  events: string[],
) {
  const layer = Layer.succeed(RuntimeService, {
    closeRuntime: () => Effect.void,
    createRuntimeWindows: () =>
      Effect.sync(() => events.push('create')).pipe(Effect.andThen(create)),
    getCurrentRuntime: Effect.succeed(null),
    openOrCreateRuntime: () => Effect.void,
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
