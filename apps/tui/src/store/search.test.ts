import type { RuntimeAttachment } from '@harbr/domain'
import { describe, expect, it } from 'vitest'

import { selectVisibleActiveRows } from './active/active-selectors'
import { selectVisibleBrowseRows } from './browse/browse-selectors'
import { tuiStore } from './app-store'
import type { TuiStoreModel } from './types'
import type { ProjectRow, WorkspaceRow } from '~/types/rows'

const runtime: RuntimeAttachment = {
  identity: {
    displayLabel: 'session',
    externalId: 'session-1',
    source: { provider: 'herdr', sourceId: '/tmp/herdr.sock' },
  },
  status: 'open',
}

function workspace(projectName: string, name: string): WorkspaceRow {
  const id = `${projectName}-${name}`

  return {
    id,
    kind: 'workspace',
    label: name,
    projectId: projectName,
    workspaceId: id,
    isActive: true,
    metadata: runtime.status,
    activeSessionCount: 1,
    hasModules: false,
    isDefault: false,
    runtime,
    target: {
      breadcrumb: `${projectName} › ${name}`,
      context: { projectId: projectName, workspaceId: id },
      label: name,
      runtimeTarget: {
        cwd: `/tmp/${id}`,
        moduleName: null,
        projectName,
        workspaceName: name,
      },
      scope: 'workspace',
    },
    workspacePath: `/tmp/${id}`,
    workspaceProvider: 'external',
  }
}

function project(name: string, metadata: string): ProjectRow {
  return {
    id: name,
    kind: 'project',
    label: name,
    projectId: name,
    isActive: false,
    metadata,
    activeSessionCount: 0,
    hasModules: false,
    hasWorkspaces: false,
    repoPath: `/tmp/${name}`,
    runtime: null,
    target: {
      breadcrumb: name,
      context: { projectId: name },
      label: name,
      runtimeTarget: {
        cwd: `/tmp/${name}`,
        moduleName: null,
        projectName: name,
        workspaceName: null,
      },
      scope: 'project',
    },
  }
}

function withActiveQuery(rows: readonly WorkspaceRow[], query: string): TuiStoreModel {
  const state = tuiStore.getState()
  return {
    ...state,
    active: { ...state.active, list: { ...state.active.list, query } },
    data: { ...state.data, activeRuntimeRows: rows },
  }
}

function withBrowseQuery(rows: readonly ProjectRow[], query: string): TuiStoreModel {
  const state = tuiStore.getState()
  return {
    ...state,
    browse: { ...state.browse, list: { ...state.browse.list, query } },
    data: { ...state.data, projectRows: rows },
  }
}

describe('list search', () => {
  it.each(['main sla', 'sla main', '  MAIN   sLa  '])(
    'matches all active session terms across workspace and project for %s',
    (query) => {
      const rows = [
        workspace('Slack', 'main'),
        workspace('Linear', 'main'),
        workspace('Slack', 'feature'),
      ]

      expect(selectVisibleActiveRows(withActiveQuery(rows, query))).toEqual([
        expect.objectContaining({ id: 'Slack-main' }),
      ])
    },
  )

  it('ranks a matching active session name ahead of context-only matches', () => {
    const rows = [workspace('Main Slack', 'feature'), workspace('Slack', 'main')]

    expect(selectVisibleActiveRows(withActiveQuery(rows, 'main sla')).map((row) => row.id)).toEqual(
      ['Slack-main', 'Main Slack-feature'],
    )
  })

  it.each(['main sla', 'sla main', '  MAIN   sLa  '])(
    'matches all project terms independently for %s',
    (query) => {
      const rows = [
        project('Main Slack', 'no sessions'),
        project('Main Linear', 'no sessions'),
        project('Slack Tools', 'no sessions'),
      ]

      expect(selectVisibleBrowseRows(withBrowseQuery(rows, query))).toEqual([
        expect.objectContaining({ id: 'Main Slack' }),
      ])
    },
  )

  it('keeps browse metadata searchable alongside a project name', () => {
    const rows = [project('Main', 'release'), project('Main Archive', 'no sessions')]

    expect(selectVisibleBrowseRows(withBrowseQuery(rows, 'main release'))).toEqual([
      expect.objectContaining({ id: 'Main' }),
    ])
  })

  it('ranks a contiguous project name match ahead of reordered terms', () => {
    const rows = [project('Sail Main', 'no sessions'), project('Main Sail', 'no sessions')]

    expect(selectVisibleBrowseRows(withBrowseQuery(rows, 'main sai')).map((row) => row.id)).toEqual(
      ['Main Sail', 'Sail Main'],
    )
  })
})
