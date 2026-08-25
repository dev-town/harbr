import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import type { CurrentRuntime, RuntimeDiscovery } from '@harbr/domain'
import {
  RuntimeDiscoveryService,
  RuntimeProviderError,
  RuntimeService,
  type RuntimeDiscoveryServiceApi,
  type RuntimeServiceApi,
} from '@harbr/runtime'
import { Effect, Layer } from 'effect'

import { getHerdrRuntimeSource } from '../herdr.source'
import { normalizeHerdrSnapshot } from '../herdr.snapshot'

const execFileAsync = promisify(execFile)
const source = getHerdrRuntimeSource()

export const RuntimeDiscoveryServiceLive = Layer.succeed(
  RuntimeDiscoveryService,
  {
    listRuntimes: discoverHerdrRuntimes(),
  } satisfies RuntimeDiscoveryServiceApi,
)

export const RuntimeServiceLive = Layer.succeed(RuntimeService, {
  closeRuntime: () => unsupported('closeRuntime'),
  createRuntimeWindows: () => unsupported('createRuntimeWindows'),
  getCurrentRuntime: getCurrentRuntimeLive(),
  openOrCreateRuntime: () => unsupported('openOrCreateRuntime'),
  source,
} satisfies RuntimeServiceApi)

function discoverHerdrRuntimes() {
  return readNormalizedSnapshot().pipe(
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

function getCurrentRuntimeLive() {
  return readNormalizedSnapshot().pipe(
    Effect.map((snapshot) => snapshot.currentRuntime),
    Effect.catchTag('HerdrUnavailable', () =>
      Effect.succeed<CurrentRuntime>(null),
    ),
    Effect.withSpan('runtime.herdr.getCurrentRuntime'),
  )
}

class HerdrUnavailable extends Error {
  readonly _tag = 'HerdrUnavailable'

  constructor(
    message: string,
    readonly providerMissing: boolean,
  ) {
    super(message)
  }
}

function readNormalizedSnapshot() {
  return Effect.tryPromise({
    try: async () => {
      const { stdout } = await execFileAsync(
        process.env.HERDR_BIN_PATH || 'herdr',
        ['api', 'snapshot'],
      )
      return normalizeHerdrSnapshot(
        JSON.parse(stdout) as unknown,
        source,
        process.env.HERDR_WORKSPACE_ID,
      )
    },
    catch: (error) =>
      new HerdrUnavailable(
        error instanceof Error ? error.message : String(error),
        isExecError(error) && error.code === 'ENOENT',
      ),
  })
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

function isExecError(
  error: unknown,
): error is Error & { code?: number | string | undefined } {
  return error instanceof Error
}
