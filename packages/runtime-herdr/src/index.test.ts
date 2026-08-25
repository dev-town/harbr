import { describe, expect, it } from 'vitest'

import { normalizeHerdrSnapshot } from './herdr.snapshot'
import { getHerdrRuntimeSource } from './index'

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
