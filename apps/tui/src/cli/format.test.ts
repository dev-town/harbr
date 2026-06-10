import { describe, expect, it } from 'vitest'

import type { SyncResult } from '@harbour/domain'
import { formatCliError, formatCliOutput } from './format'

describe('formatCliOutput', () => {
  it('formats scanned projects as readable blocks', () => {
    const output: SyncResult = {
      projects: [
        {
          projectName: 'alpha',
          repoPath: '/tmp/repo',
          repoKind: 'standard',
          workspaceCount: 2,
          moduleCount: 2,
          runtimeCount: 1,
          status: 'synced',
          errorTag: null,
          runtimeIssue: null,
        },
      ],
    }

    expect(formatCliOutput(output)).toBe(
      [
        'alpha',
        '  repo: standard',
        '  workspaces: 2',
        '  modules: 2',
        '  runtimes: 1',
      ].join('\n'),
    )
  })

  it('formats bare repos without workspace', () => {
    const output: SyncResult = {
      projects: [
        {
          projectName: 'alpha',
          repoPath: '/tmp/repo.git',
          repoKind: 'bare',
          workspaceCount: 0,
          moduleCount: 0,
          runtimeCount: 0,
          status: 'no_workspace',
          errorTag: null,
          runtimeIssue: 'tmux_not_found',
        },
      ],
    }

    expect(formatCliOutput(output)).toBe(
      [
        'alpha',
        '  repo: bare',
        '  workspaces: 0',
        '  modules: 0',
        '  runtimes: 0',
        '  status: no workspace',
        '  runtime issue: tmux_not_found',
      ].join('\n'),
    )
  })

  it('formats project-level repo errors', () => {
    const output: SyncResult = {
      projects: [
        {
          projectName: 'alpha',
          repoPath: '/tmp/missing',
          repoKind: null,
          workspaceCount: 0,
          moduleCount: 0,
          runtimeCount: 0,
          status: 'error',
          errorTag: 'RepoNotFoundError',
          runtimeIssue: null,
        },
      ],
    }

    expect(formatCliOutput(output)).toBe(
      ['alpha', '  error: RepoNotFoundError'].join('\n'),
    )
  })
})

describe('formatCliError', () => {
  it('formats invalid config issues', () => {
    expect(
      formatCliError({
        _tag: 'InvalidConfigError',
        configPath: '/tmp/harbour.json',
        issues: [
          {
            code: 'repo_not_found',
            path: ['projects', 0, 'repo'],
            message: 'repo path not found: /tmp/missing',
          },
        ],
      }),
    ).toBe(
      [
        'config error: InvalidConfigError',
        '  config: /tmp/harbour.json',
        '  issues:',
        '    projects.0.repo: repo path not found: /tmp/missing',
      ].join('\n'),
    )
  })

  it('formats simple top-level errors', () => {
    expect(
      formatCliError({
        _tag: 'ConfigNotFoundError',
        configPath: '/tmp/harbour.json',
      }),
    ).toBe(['error: ConfigNotFoundError', '  path: /tmp/harbour.json'].join('\n'))
  })
})
