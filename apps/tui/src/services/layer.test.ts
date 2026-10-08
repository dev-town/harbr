import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { ConfigService } from '@harbr/config'
import { DatabaseClient, ProjectService } from '@harbr/db'
import { GitService } from '@harbr/git'
import { ReconcilerService } from '@harbr/reconciler'
import { RuntimeDiscoveryService, RuntimeService } from '@harbr/runtime'
import { ScannerService } from '@harbr/scanner'
import { Effect } from 'effect'
import { expect, it } from 'vitest'

import { makeTuiEffectRuntime } from './effect-runtime'

it('builds the TUI service graph with its required services', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'harbr-tui-layer-'))
  const configPath = path.join(root, 'config.json')
  await writeFile(configPath, JSON.stringify({ projects: [] }))

  const runtime = makeTuiEffectRuntime({
    configPath,
    dbPath: path.join(root, 'state.sqlite'),
  })

  try {
    const result = await runtime.runPromise(
      Effect.gen(function* () {
        const config = yield* ConfigService
        yield* DatabaseClient
        const projects = yield* ProjectService
        yield* GitService
        yield* RuntimeDiscoveryService
        yield* RuntimeService
        yield* ScannerService
        yield* ReconcilerService

        return {
          config: yield* config.load,
          missingProject: yield* projects.findByName('missing'),
        }
      }),
    )

    expect(result.config.projects).toEqual([])
    expect(result.missingProject).toBeNull()
  } finally {
    await runtime.dispose()
    await rm(root, { force: true, recursive: true })
  }
})
