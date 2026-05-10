import { describe, expect, it } from 'vitest'
import { RepoNotFoundError } from '@harbour/git'

import { formatCliError, formatCliOutput, type CliOutput } from './format'

describe('formatCliOutput', () => {
  it('formats scanned projects as readable blocks', () => {
    const output: CliOutput = {
      config: {
        configPath: '/tmp/harbour.json',
      },
      repos: [
        {
          project: 'alpha',
          repo: {
            repoPath: '/tmp/repo',
            kind: 'standard',
          },
          scan: {
            projectName: 'alpha',
            repoPath: '/tmp/repo',
            workspacePath: '/tmp/workspace',
            modules: [
              {
                name: 'apps/cli',
                path: 'apps/cli',
                workspacePath: '/tmp/workspace/apps/cli',
                selector: {
                  raw: 'apps/',
                  path: 'apps',
                  mode: 'children',
                },
              },
              {
                name: 'apps/tui',
                path: 'apps/tui',
                workspacePath: '/tmp/workspace/apps/tui',
                selector: {
                  raw: 'apps/',
                  path: 'apps',
                  mode: 'children',
                },
              },
            ],
          },
        },
      ],
    }

    expect(formatCliOutput(output)).toBe(
      ['alpha', '  repo: standard', '  workspace: /tmp/workspace', '  modules: 2', '    apps/cli', '    apps/tui'].join('\n'),
    )
  })

  it('formats bare repos without workspace', () => {
    const output: CliOutput = {
      config: {
        configPath: '/tmp/harbour.json',
      },
      repos: [
        {
          project: 'alpha',
          repo: {
            repoPath: '/tmp/repo.git',
            kind: 'bare',
          },
          scan: null,
        },
      ],
    }

    expect(formatCliOutput(output)).toBe(
      ['alpha', '  repo: bare', '  workspace: none', '  modules: 0'].join('\n'),
    )
  })

  it('formats project-level repo errors', () => {
    const output: CliOutput = {
      config: {
        configPath: '/tmp/harbour.json',
      },
      repos: [
        {
          project: 'alpha',
          error: new RepoNotFoundError({
            repoPath: '/tmp/missing',
          }),
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
