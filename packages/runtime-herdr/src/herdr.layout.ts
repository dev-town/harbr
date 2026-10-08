import { normalize, resolve } from 'node:path'

import type { RuntimeSource, WindowPaneConfig } from '@harbr/domain'
import {
  RuntimeProviderError,
  normalizeRuntimePaneCommands,
  resolveRuntimePaneCwd,
  type CreateRuntimeWindowsResult,
  type RuntimeWindowCreation,
} from '@harbr/runtime'
import { Effect } from 'effect'

import type { HerdrClientApi } from './herdr.client'
import { formatHerdrWorkspaceLabel } from './herdr.label'
import {
  normalizeHerdrSnapshot,
  readHerdrSessionSnapshot,
  type HerdrSessionSnapshot,
} from './herdr.snapshot'

type CreatedHerdrSurface = {
  readonly paneId: string
  readonly tabId: string
  readonly workspaceId?: string
}

export function createHerdrRuntimeWindows(
  client: HerdrClientApi,
  input: RuntimeWindowCreation,
  source: RuntimeSource,
) {
  return Effect.gen(function* () {
    let snapshot = yield* readSnapshot(client)
    const existingRuntime = normalizeHerdrSnapshot(snapshot, source).runtimes.find(
      (runtime) => canonicalPath(runtime.contextPath) === canonicalPath(input.target.cwd),
    )
    let workspaceId = existingRuntime?.identity.externalId
    let initialSurface: CreatedHerdrSurface | null = null

    if (!workspaceId) {
      initialSurface = yield* executeAndRead(
        client,
        [
          'workspace',
          'create',
          '--cwd',
          input.target.cwd,
          '--label',
          formatHerdrWorkspaceLabel(input.target),
          '--no-focus',
        ],
        readWorkspaceCreation,
      )
      workspaceId = initialSurface.workspaceId

      if (!workspaceId) {
        return yield* Effect.fail(new Error('Herdr workspace creation response is missing an ID'))
      }

      snapshot = yield* readSnapshot(client)
    } else {
      initialSurface = findReusableInitialSurface(snapshot, workspaceId)
    }

    const existingTabNames = new Set(
      snapshot.tabs
        .filter((tab) => tab.workspace_id === workspaceId && tab.tab_id !== initialSurface?.tabId)
        .map((tab) => tab.label),
    )
    const createdWindowNames: string[] = []
    const skippedWindowNames: string[] = []
    let unusedInitialSurface = initialSurface

    for (const window of input.windows) {
      if (existingTabNames.has(window.name)) {
        skippedWindowNames.push(window.name)
        continue
      }

      const firstPane = window.panes[0]
      const firstPaneCwd = resolveRuntimePaneCwd(input.target.cwd, firstPane?.cwd)
      let surface: CreatedHerdrSurface

      if (unusedInitialSurface && canonicalPath(firstPaneCwd) === canonicalPath(input.target.cwd)) {
        surface = unusedInitialSurface
        unusedInitialSurface = null
        yield* client.execute(['tab', 'rename', surface.tabId, window.name])
      } else {
        surface = yield* executeAndRead(
          client,
          [
            'tab',
            'create',
            '--workspace',
            workspaceId,
            '--cwd',
            firstPaneCwd,
            '--label',
            window.name,
            '--no-focus',
          ],
          readTabCreation,
        )
      }

      yield* configureTab(client, surface, input.target.cwd, window.panes)
      existingTabNames.add(window.name)
      createdWindowNames.push(window.name)
    }

    if (unusedInitialSurface && createdWindowNames.length > 0) {
      yield* client.execute(['tab', 'close', unusedInitialSurface.tabId])
    }

    if (createdWindowNames.length > 0) {
      yield* client.execute(['workspace', 'focus', workspaceId])
    }

    return {
      createdWindowNames,
      skippedWindowNames,
    } satisfies CreateRuntimeWindowsResult
  }).pipe(
    Effect.mapError(
      (error) =>
        new RuntimeProviderError({
          message: `Herdr could not apply this layout: ${error.message}`,
          operation: 'createRuntimeWindows',
          provider: source.provider,
        }),
    ),
    Effect.withSpan('runtime.herdr.createRuntimeWindows', {
      attributes: {
        'harbr.project.name': input.target.projectName,
        'harbr.runtime.scope': getRuntimeTargetScope(input.target),
        'harbr.window.count': input.windows.length,
      },
    }),
  )
}

function configureTab(
  client: HerdrClientApi,
  surface: CreatedHerdrSurface,
  runtimeCwd: string,
  panes: RuntimeWindowCreation['windows'][number]['panes'],
) {
  return Effect.gen(function* () {
    const firstPane = panes[0]

    if (!firstPane) {
      return
    }

    yield* configurePane(client, surface.paneId, firstPane)

    for (const pane of panes.slice(1)) {
      const createdPane = yield* executeAndRead(
        client,
        [
          'pane',
          'split',
          surface.paneId,
          '--direction',
          'right',
          '--cwd',
          resolveRuntimePaneCwd(runtimeCwd, pane.cwd),
          '--no-focus',
        ],
        readPaneCreation,
      )
      yield* configurePane(client, createdPane.paneId, pane)
    }
  })
}

function configurePane(client: HerdrClientApi, paneId: string, pane: WindowPaneConfig) {
  return Effect.gen(function* () {
    yield* client.execute(['pane', 'rename', paneId, pane.name])

    for (const command of normalizeRuntimePaneCommands(pane.command)) {
      yield* client.execute(['pane', 'run', paneId, command])
    }
  })
}

function readSnapshot(client: HerdrClientApi) {
  return client.execute(['api', 'snapshot']).pipe(
    Effect.flatMap((stdout) =>
      Effect.try({
        try: () => readHerdrSessionSnapshot(JSON.parse(stdout) as unknown),
        catch: (error) => (error instanceof Error ? error : new Error(String(error))),
      }),
    ),
  )
}

function executeAndRead(
  client: HerdrClientApi,
  args: readonly string[],
  read: (input: unknown) => CreatedHerdrSurface,
) {
  return client.execute(args).pipe(
    Effect.flatMap((stdout) =>
      Effect.try({
        try: () => read(JSON.parse(stdout) as unknown),
        catch: (error) => (error instanceof Error ? error : new Error(String(error))),
      }),
    ),
  )
}

function readWorkspaceCreation(input: unknown): CreatedHerdrSurface {
  const result = readResult(input)
  const surface = readCreatedSurface(result)
  const workspace = readRecord(result.workspace, 'workspace')

  if (typeof workspace.workspace_id !== 'string') {
    throw new Error('Herdr workspace creation response is missing an ID')
  }

  return { ...surface, workspaceId: workspace.workspace_id }
}

function readTabCreation(input: unknown) {
  return readCreatedSurface(readResult(input))
}

function readPaneCreation(input: unknown): CreatedHerdrSurface {
  const result = readResult(input)
  const pane = readRecord(result.pane, 'pane')

  if (typeof pane.pane_id !== 'string') {
    throw new Error('Herdr pane split response is missing an ID')
  }

  return { paneId: pane.pane_id, tabId: '' }
}

function readCreatedSurface(result: Record<string, unknown>) {
  const tab = readRecord(result.tab, 'tab')
  const pane = readRecord(result.root_pane, 'root pane')

  if (typeof tab.tab_id !== 'string' || typeof pane.pane_id !== 'string') {
    throw new Error('Herdr tab creation response is missing an ID')
  }

  return { paneId: pane.pane_id, tabId: tab.tab_id }
}

function readResult(input: unknown) {
  const response = readRecord(input, 'response')
  return readRecord(response.result, 'result')
}

function readRecord(input: unknown, name: string): Record<string, unknown> {
  if (typeof input !== 'object' || input === null) {
    throw new Error(`Herdr ${name} is not an object`)
  }

  return input as Record<string, unknown>
}

function findReusableInitialSurface(
  snapshot: HerdrSessionSnapshot,
  workspaceId: string,
): CreatedHerdrSurface | null {
  const tabs = snapshot.tabs.filter((tab) => tab.workspace_id === workspaceId)
  const panes = snapshot.panes.filter((pane) => pane.workspace_id === workspaceId)
  const tab = tabs[0]
  const pane = panes[0]

  return tabs.length === 1 &&
    panes.length === 1 &&
    tab &&
    pane?.pane_id &&
    pane.tab_id === tab.tab_id &&
    !pane.label
    ? { paneId: pane.pane_id, tabId: tab.tab_id }
    : null
}

function canonicalPath(path: string) {
  return normalize(resolve(path))
}

function getRuntimeTargetScope(target: RuntimeWindowCreation['target']) {
  if (target.moduleName) {
    return 'module'
  }

  if (target.workspaceName) {
    return 'workspace'
  }

  return 'project'
}
