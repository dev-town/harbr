import { normalize, resolve } from 'node:path'

import {
  isSameRuntimeSource,
  type CurrentRuntime,
  type RuntimeDiscovery,
  type RuntimeIdentity,
} from '@harbr/domain'
import {
  RuntimeDiscoveryService,
  RuntimeProviderError,
  RuntimeService,
  type RuntimeDiscoveryServiceApi,
  type RuntimeServiceApi,
} from '@harbr/runtime'
import { Effect, Layer } from 'effect'

import {
  HerdrClient,
  HerdrClientLive,
  HerdrUnavailable,
  type HerdrClientApi,
} from '../herdr.client'
import { formatHerdrWorkspaceLabel } from '../herdr.label'
import { getHerdrRuntimeSource } from '../herdr.source'
import { normalizeHerdrSnapshot } from '../herdr.snapshot'

const source = getHerdrRuntimeSource()

export const RuntimeDiscoveryServiceLayer = Layer.effect(
  RuntimeDiscoveryService,
  Effect.gen(function* () {
    const client = yield* HerdrClient

    return {
      listRuntimes: discoverHerdrRuntimes(client),
    } satisfies RuntimeDiscoveryServiceApi
  }),
)

export const RuntimeServiceLayer = Layer.effect(
  RuntimeService,
  Effect.gen(function* () {
    const client = yield* HerdrClient

    return {
      closeRuntime: (identity) => closeRuntimeLive(client, identity),
      createRuntimeWindows: () => unsupported('createRuntimeWindows'),
      getCurrentRuntime: getCurrentRuntimeLive(client),
      openOrCreateRuntime: (target) => openOrCreateRuntimeLive(client, target),
      source,
    } satisfies RuntimeServiceApi
  }),
)

export const RuntimeDiscoveryServiceLive = RuntimeDiscoveryServiceLayer.pipe(
  Layer.provide(HerdrClientLive),
)

export const RuntimeServiceLive = RuntimeServiceLayer.pipe(
  Layer.provide(HerdrClientLive),
)

function discoverHerdrRuntimes(client: HerdrClientApi) {
  return readNormalizedSnapshot(client).pipe(
    Effect.map(
      (snapshot) =>
        ({
          runtimes: snapshot.runtimes,
          runtimeIssue: null,
          source,
        }) satisfies RuntimeDiscovery,
    ),
    Effect.catchTag('HerdrUnavailable', (error) =>
      Effect.succeed<RuntimeDiscovery>({
        runtimes: [],
        runtimeIssue: {
          code: error.providerMissing
            ? 'provider_not_found'
            : 'source_unavailable',
          source,
        },
        source,
      }),
    ),
    Effect.withSpan('runtime.herdr.listRuntimes'),
  )
}

function closeRuntimeLive(client: HerdrClientApi, identity: RuntimeIdentity) {
  if (!isSameRuntimeSource(identity.source, source)) {
    return Effect.fail(
      new RuntimeProviderError({
        message: 'Runtime does not belong to the active Herdr source',
        operation: 'closeRuntime',
        provider: source.provider,
      }),
    )
  }

  return client.execute(['workspace', 'close', identity.externalId]).pipe(
    Effect.mapError(
      (error) =>
        new RuntimeProviderError({
          message: `Herdr could not close this workspace: ${error.message}`,
          operation: 'closeRuntime',
          provider: source.provider,
        }),
    ),
    Effect.asVoid,
    Effect.withSpan('runtime.herdr.closeRuntime', {
      attributes: {
        'herdr.workspace.id': identity.externalId,
      },
    }),
  )
}

function getCurrentRuntimeLive(client: HerdrClientApi) {
  return readNormalizedSnapshot(client).pipe(
    Effect.map((snapshot) => snapshot.currentRuntime),
    Effect.catchTag('HerdrUnavailable', () =>
      Effect.succeed<CurrentRuntime>(null),
    ),
    Effect.withSpan('runtime.herdr.getCurrentRuntime'),
  )
}

function openOrCreateRuntimeLive(
  client: HerdrClientApi,
  target: Parameters<RuntimeServiceApi['openOrCreateRuntime']>[0],
) {
  return Effect.gen(function* () {
    const snapshot = yield* readNormalizedSnapshot(client)
    const existing = snapshot.runtimes.find(
      (runtime) =>
        canonicalPath(runtime.contextPath) === canonicalPath(target.cwd),
    )

    if (existing) {
      yield* client.execute([
        'workspace',
        'focus',
        existing.identity.externalId,
      ])
      return
    }

    yield* client.execute([
      'workspace',
      'create',
      '--cwd',
      target.cwd,
      '--label',
      formatHerdrWorkspaceLabel(target),
      '--focus',
    ])
  }).pipe(
    Effect.mapError(
      (error) =>
        new RuntimeProviderError({
          message: `Herdr could not open this context: ${error.message}`,
          operation: 'openOrCreateRuntime',
          provider: source.provider,
        }),
    ),
    Effect.withSpan('runtime.herdr.openOrCreateRuntime', {
      attributes: {
        'harbr.project.name': target.projectName,
        'harbr.runtime.scope': getRuntimeTargetScope(target),
      },
    }),
  )
}

function readNormalizedSnapshot(client: HerdrClientApi) {
  return client.execute(['api', 'snapshot']).pipe(
    Effect.flatMap((stdout) =>
      Effect.try({
        try: () =>
          normalizeHerdrSnapshot(
            JSON.parse(stdout) as unknown,
            source,
            process.env.HERDR_ACTIVE_WORKSPACE_ID ||
              process.env.HERDR_WORKSPACE_ID,
          ),
        catch: (error) =>
          new HerdrUnavailable(
            error instanceof Error ? error.message : String(error),
            false,
          ),
      }),
    ),
  )
}

function unsupported(operation: string) {
  return Effect.fail(
    new RuntimeProviderError({
      message: 'Herdr runtime mutations are not available in this release',
      operation,
      provider: source.provider,
    }),
  )
}

function canonicalPath(path: string) {
  return normalize(resolve(path))
}

function getRuntimeTargetScope(
  target: Parameters<RuntimeServiceApi['openOrCreateRuntime']>[0],
) {
  if (target.moduleName) {
    return 'module'
  }

  if (target.workspaceName) {
    return 'workspace'
  }

  return 'project'
}
