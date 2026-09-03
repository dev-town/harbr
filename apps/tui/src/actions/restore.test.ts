import {
  ProjectService,
  type ProjectServiceApi,
} from '@harbr/db'
import type {
  ActiveRuntimeSummary,
  ModuleSummary,
  ProjectSummary,
  RuntimeAttachment,
  WorkspaceSummary,
} from '@harbr/domain'
import { RuntimeService, type RuntimeServiceApi } from '@harbr/runtime'
import { Effect, Layer } from 'effect'
import { beforeEach, describe, expect, it } from 'vitest'

import type { TuiServices } from '~/app-context'
import {
  selectVisibleBrowseRows,
  tuiStore,
} from '~/store'
import { createAppState } from '~/store/app/app-state'
import { createBrowseState } from '~/store/browse/browse-state'
import { createDataState } from '~/store/data/data-state'
import { restoreCurrentRuntime } from './restore'

const source = { provider: 'herdr', sourceId: '/tmp/herdr.sock' } as const
const currentAttachment: RuntimeAttachment = {
  identity: {
    displayLabel: 'current',
    externalId: 'runtime-current',
    source,
  },
  status: 'open',
}

describe('restoreCurrentRuntime', () => {
  beforeEach(() => {
    tuiStore.setState((state) => ({
      ...state,
      app: { ...createAppState(), currentRuntime: currentAttachment },
      browse: createBrowseState(),
      data: createDataState(),
    }))
  })

  it.each([
    ['wrong workspace first', ['workspace-wrong', 'workspace-current']],
    ['current workspace first', ['workspace-current', 'workspace-wrong']],
  ])('restores the exact current workspace with %s', async (_label, order) => {
    const workspaces = order.map((id) => workspaceSummary(id))
    const currentRuntime = activeRuntime({
      scope: 'workspace',
      workspaceId: 'workspace-current',
    })

    const restored = await restoreCurrentRuntime(
      testServices(workspaces),
      tuiStore,
      currentRuntime,
      [projectSummary('project-current')],
    )

    expect(restored).toBe(true)
    expect(tuiStore.getState().browse.list.selectedId).toBe('workspace-current')
    expect(tuiStore.getState().browse.scope).toEqual({
      level: 'workspaces',
      projectId: 'project-current',
    })

    const selectedRow = selectVisibleBrowseRows(tuiStore.getState()).find(
      (row) => row.id === tuiStore.getState().browse.list.selectedId,
    )
    expect(selectedRow?.isCurrent).toBe(true)
  })

  it('restores the exact project when names collide', async () => {
    const restored = await restoreCurrentRuntime(
      testServices([]),
      tuiStore,
      activeRuntime({ scope: 'project' }),
      [projectSummary('project-wrong'), projectSummary('project-current')],
    )

    expect(restored).toBe(true)
    expect(tuiStore.getState().browse.list.selectedId).toBe('project-current')
  })

  it('restores the exact module when labels collide', async () => {
    const modules = [
      moduleSummary('module-wrong'),
      moduleSummary('module-current'),
    ]
    const restored = await restoreCurrentRuntime(
      testServices([workspaceSummary('workspace-current')], modules),
      tuiStore,
      activeRuntime({
        moduleId: 'module-current',
        scope: 'module',
        workspaceId: 'workspace-current',
      }),
      [projectSummary('project-current')],
    )

    expect(restored).toBe(true)
    expect(tuiStore.getState().browse.list.selectedId).toBe('module-current')
  })

  it('does not fall back to an ambiguous workspace name', async () => {
    const restored = await restoreCurrentRuntime(
      testServices([workspaceSummary('workspace-wrong')]),
      tuiStore,
      activeRuntime({ scope: 'workspace', workspaceId: 'workspace-missing' }),
      [projectSummary('project-current')],
    )

    expect(restored).toBe(false)
    expect(tuiStore.getState().browse.list.selectedId).toBe('project-current')
  })
})

function testServices(
  workspaces: readonly WorkspaceSummary[],
  modules: readonly ModuleSummary[] = [],
) {
  const projectLayer = Layer.succeed(
    ProjectService,
    {
      listModuleSummaries: () => Effect.succeed(modules),
      listWorkspaceSummaries: () => Effect.succeed(workspaces),
    } as unknown as ProjectServiceApi,
  )
  const runtimeLayer = Layer.succeed(
    RuntimeService,
    { source } as unknown as RuntimeServiceApi,
  )
  const layer = Layer.merge(projectLayer, runtimeLayer)

  return {
    effectRuntime: {
      runPromise: <A, E>(
        effect: Effect.Effect<A, E, ProjectService | RuntimeService>,
      ) => Effect.runPromise(effect.pipe(Effect.provide(layer))),
    },
  } as unknown as TuiServices
}

function projectSummary(id: string): ProjectSummary {
  return {
    activeSessionCount: id === 'project-current' ? 1 : 0,
    hasModules: true,
    hasWorkspaces: true,
    id,
    name: 'harbr',
    repoKind: 'standard',
    repoPath: `/repos/${id}`,
    runtime: id === 'project-current' ? currentAttachment : null,
    workspaceCount: 2,
  }
}

function workspaceSummary(id: string): WorkspaceSummary {
  return {
    activeSessionCount: id === 'workspace-current' ? 1 : 0,
    branchName: 'main',
    hasModules: true,
    id,
    isDefault: false,
    kind: 'worktree',
    moduleCount: 2,
    name: 'main',
    projectId: 'project-current',
    projectName: 'harbr',
    repoPath: '/repos/harbr',
    runtime: id === 'workspace-current' ? currentAttachment : null,
    workspacePath: `/worktrees/${id}/main`,
    workspaceProvider: id === 'workspace-current' ? 'harbr' : 'codex',
  }
}

function moduleSummary(id: string): ModuleSummary {
  return {
    hasActiveSession: id === 'module-current',
    id,
    name: 'api',
    path: id,
    projectId: 'project-current',
    projectName: 'harbr',
    repoPath: '/repos/harbr',
    runtime: id === 'module-current' ? currentAttachment : null,
    workspaceId: 'workspace-current',
    workspaceName: 'main',
    workspacePath: '/worktrees/workspace-current/main',
    workspaceProvider: 'harbr',
  }
}

function activeRuntime({
  moduleId = null,
  scope,
  workspaceId = null,
}: {
  moduleId?: string | null
  scope: ActiveRuntimeSummary['scope']
  workspaceId?: string | null
}): ActiveRuntimeSummary {
  return {
    branchName: workspaceId ? 'main' : null,
    id: 'active-current',
    moduleId,
    moduleName: moduleId ? 'api' : null,
    modulePath: moduleId ?? null,
    projectId: 'project-current',
    projectName: 'harbr',
    repoPath: '/repos/harbr',
    runtime: currentAttachment,
    scope,
    workspaceId,
    workspaceName: workspaceId ? 'main' : null,
    workspacePath: workspaceId
      ? '/worktrees/workspace-current/main'
      : null,
    workspaceProvider: workspaceId ? 'harbr' : null,
  }
}
