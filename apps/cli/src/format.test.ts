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
          workspacePath: '/tmp/workspace',
          moduleCount: 2,
          status: 'synced',
          errorTag: null,
        },
      ],
    }

    expect(formatCliOutput(output)).toBe(
      ['alpha', '  repo: standard', '  workspace: /tmp/workspace', '  modules: 2'].join('\n'),
    )
  })

  it('formats bare repos without workspace', () => {
    const output: SyncResult = {
      projects: [
        {
          projectName: 'alpha',
          repoPath: '/tmp/repo.git',
          repoKind: 'bare',
          workspacePath: null,
          moduleCount: 0,
          status: 'no_workspace',
          errorTag: null,
        },
      ],
    }

    expect(formatCliOutput(output)).toBe(
      [
        'alpha',
        '  repo: bare',
        '  workspace: none',
        '  modules: 0',
        '  status: no workspace',
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
          workspacePath: null,
          moduleCount: 0,
          status: 'error',
          errorTag: 'RepoNotFoundError',
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
