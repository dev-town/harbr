import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import path from 'node:path'

import { Either, Effect } from 'effect'
import { afterEach, describe, expect, it } from 'vitest'

import {
  ConfigNotFoundError,
  InvalidConfigError,
  InvalidJsonError,
  loadConfigAtPath,
} from './index'

const tempRoots: string[] = []

afterEach(async () => {
  await Promise.all(
    tempRoots
      .splice(0)
      .map((tempRoot) => rm(tempRoot, { force: true, recursive: true })),
  )
})

describe('loadConfigAtPath', () => {
  it('returns config_not_found for missing files', async () => {
    const result = await runEither(
      loadConfigAtPath('/tmp/harbour-config-that-does-not-exist.json'),
    )

    expectLeft(result, ConfigNotFoundError, {
      configPath: '/tmp/harbour-config-that-does-not-exist.json',
    })
  })

  it('returns invalid_json for bad json', async () => {
    const tempRoot = await createTempRoot()
    const configPath = path.join(tempRoot, 'config.json')

    await writeFile(configPath, '{bad json', 'utf8')

    const result = await runEither(loadConfigAtPath(configPath))

    expectLeft(result, InvalidJsonError, {})
  })

  it('returns schema issues for duplicate project names', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const modulePath = path.join(repoPath, 'packages', 'core')
    const configPath = path.join(tempRoot, 'config.json')

    await mkdir(modulePath, { recursive: true })
    await writeJson(configPath, {
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: ['packages/core'],
        },
        {
          name: 'alpha',
          repo: repoPath,
          modules: ['packages/api'],
        },
      ],
    })

    const result = await runEither(loadConfigAtPath(configPath))

    expect(Either.isLeft(result)).toBe(true)
    if (!Either.isLeft(result)) {
      return
    }

    expect(result.left).toBeInstanceOf(InvalidConfigError)
    if (!(result.left instanceof InvalidConfigError)) {
      return
    }

    expect(result.left.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'duplicate_project_name' }),
      ]),
    )
  })

  it('normalizes explicit selectors without checking existence', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const configPath = path.join(tempRoot, 'config.json')

    await mkdir(repoPath, { recursive: true })
    await writeJson(configPath, {
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: ['packages/core', 'packages/core-2'],
        },
      ],
    })

    await expect(runSuccess(loadConfigAtPath(configPath))).resolves.toEqual({
      configPath,
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: [
            { raw: 'packages/core', path: 'packages/core', mode: 'explicit' },
            {
              raw: 'packages/core-2',
              path: 'packages/core-2',
              mode: 'explicit',
            },
          ],
          windows: [],
        },
      ],
    })
  })

  it('returns repo_not_found when repo path does not exist', async () => {
    const tempRoot = await createTempRoot()
    const configPath = path.join(tempRoot, 'config.json')

    await writeJson(configPath, {
      projects: [
        {
          name: 'alpha',
          repo: path.join(tempRoot, 'missing-repo'),
          modules: ['packages/core'],
        },
      ],
    })

    const result = await runEither(loadConfigAtPath(configPath))

    expect(Either.isLeft(result)).toBe(true)
    if (!Either.isLeft(result)) {
      return
    }

    expect(result.left).toBeInstanceOf(InvalidConfigError)
    if (!(result.left instanceof InvalidConfigError)) {
      return
    }

    expect(result.left.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'repo_not_found' }),
      ]),
    )
  })

  it('normalizes children selectors', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const configPath = path.join(tempRoot, 'config.json')

    await mkdir(repoPath, { recursive: true })
    await writeJson(configPath, {
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: ['packages/', 'docs'],
        },
      ],
    })

    await expect(runSuccess(loadConfigAtPath(configPath))).resolves.toEqual({
      configPath,
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: [
            { raw: 'packages/', path: 'packages', mode: 'children' },
            { raw: 'docs', path: 'docs', mode: 'explicit' },
          ],
          windows: [],
        },
      ],
    })
  })

  it('rejects module paths that escape the repo', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const configPath = path.join(tempRoot, 'config.json')

    await mkdir(repoPath, { recursive: true })
    await mkdir(path.join(tempRoot, 'elsewhere'), { recursive: true })
    await writeJson(configPath, {
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: ['../elsewhere'],
        },
      ],
    })

    const result = await runEither(loadConfigAtPath(configPath))

    expect(Either.isLeft(result)).toBe(true)
    if (!Either.isLeft(result)) {
      return
    }

    expect(result.left).toBeInstanceOf(InvalidConfigError)
    if (!(result.left instanceof InvalidConfigError)) {
      return
    }

    expect(result.left.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'module_path_not_relative' }),
      ]),
    )
  })

  it('normalizes root selectors from dot forms', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const configPath = path.join(tempRoot, 'config.json')

    await mkdir(repoPath, { recursive: true })
    await writeJson(configPath, {
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: ['.', './', './docs', 'docs/'],
        },
      ],
    })

    await expect(runSuccess(loadConfigAtPath(configPath))).resolves.toEqual({
      configPath,
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: [
            { raw: '.', path: '.', mode: 'explicit' },
            { raw: './', path: '.', mode: 'explicit' },
            { raw: './docs', path: 'docs', mode: 'explicit' },
            { raw: 'docs/', path: 'docs', mode: 'children' },
          ],
          windows: [],
        },
      ],
    })
  })

  it('rejects slash root selector with clearer guidance', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const configPath = path.join(tempRoot, 'config.json')

    await mkdir(repoPath, { recursive: true })
    await writeJson(configPath, {
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: ['/'],
        },
      ],
    })

    const result = await runEither(loadConfigAtPath(configPath))

    expect(Either.isLeft(result)).toBe(true)
    if (!Either.isLeft(result)) {
      return
    }

    expect(result.left).toBeInstanceOf(InvalidConfigError)
    if (!(result.left instanceof InvalidConfigError)) {
      return
    }

    expect(result.left.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'module_path_not_relative',
          message: 'module selector `/` is not supported; use `.` for repo root',
        }),
      ]),
    )
  })

  it('normalizes a valid config', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo.git')
    const configPath = path.join(tempRoot, 'config.json')

    await mkdir(repoPath, { recursive: true })
    await writeJson(configPath, {
      $schema: '../../packages/config/harbour.schema.json',
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: ['./apps/', 'docs'],
        },
      ],
    })

    await expect(runSuccess(loadConfigAtPath(configPath))).resolves.toEqual({
      $schema: '../../packages/config/harbour.schema.json',
      configPath,
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: [
            { raw: './apps/', path: 'apps', mode: 'children' },
            { raw: 'docs', path: 'docs', mode: 'explicit' },
          ],
          windows: [],
        },
      ],
    })
  })

  it('expands ~ in config and repo paths', async () => {
    const tempRoot = await mkdtemp(path.join(homedir(), 'harbour-config-home-'))
    tempRoots.push(tempRoot)

    const repoPath = path.join(tempRoot, 'repo')
    const configPath = path.join(tempRoot, 'config.json')
    const tildeConfigPath = configPath.replace(homedir(), '~')
    const tildeRepoPath = repoPath.replace(homedir(), '~')

    await mkdir(repoPath, { recursive: true })
    await writeJson(configPath, {
      projects: [
        {
          name: 'alpha',
          repo: tildeRepoPath,
          modules: ['packages/', 'docs'],
        },
      ],
    })

    await expect(
      runSuccess(loadConfigAtPath(tildeConfigPath)),
    ).resolves.toEqual({
      configPath,
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: [
            { raw: 'packages/', path: 'packages', mode: 'children' },
            { raw: 'docs', path: 'docs', mode: 'explicit' },
          ],
          windows: [],
        },
      ],
    })
  })

  it('uses all global windows when project windows are omitted', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const configPath = path.join(tempRoot, 'config.json')

    await mkdir(repoPath, { recursive: true })
    await writeJson(configPath, {
      windows: [
        { name: 'Shell', panes: [{ name: 'Shell' }] },
        {
          name: 'Dev',
          panes: [
            { name: 'Server', command: 'bun run dev' },
            { name: 'Tests', command: ['bun run test', 'bun run lint'] },
          ],
        },
      ],
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: ['.'],
        },
      ],
    })

    await expect(runSuccess(loadConfigAtPath(configPath))).resolves.toEqual({
      configPath,
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: [{ raw: '.', path: '.', mode: 'explicit' }],
          windows: [
            { name: 'Shell', panes: [{ name: 'Shell' }] },
            {
              name: 'Dev',
              panes: [
                { name: 'Server', command: 'bun run dev' },
                { name: 'Tests', command: ['bun run test', 'bun run lint'] },
              ],
            },
          ],
        },
      ],
    })
  })

  it('allows projects to disable windows with an empty list', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const configPath = path.join(tempRoot, 'config.json')

    await mkdir(repoPath, { recursive: true })
    await writeJson(configPath, {
      windows: [{ name: 'Shell', panes: [{ name: 'Shell' }] }],
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: ['.'],
          windows: [],
        },
      ],
    })

    await expect(runSuccess(loadConfigAtPath(configPath))).resolves.toEqual({
      configPath,
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: [{ raw: '.', path: '.', mode: 'explicit' }],
          windows: [],
        },
      ],
    })
  })

  it('resolves project window refs and inline windows in order', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const configPath = path.join(tempRoot, 'config.json')

    await mkdir(repoPath, { recursive: true })
    await writeJson(configPath, {
      windows: [
        { name: 'Shell', panes: [{ name: 'Shell' }] },
        { name: 'Dev', panes: [{ name: 'Server' }] },
      ],
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: ['.'],
          windows: [
            'Dev',
            {
              name: 'Agents',
              panes: [{ name: 'Planner' }, { name: 'Builder' }],
            },
            'Shell',
          ],
        },
      ],
    })

    await expect(runSuccess(loadConfigAtPath(configPath))).resolves.toEqual({
      configPath,
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: [{ raw: '.', path: '.', mode: 'explicit' }],
          windows: [
            { name: 'Dev', panes: [{ name: 'Server' }] },
            {
              name: 'Agents',
              panes: [{ name: 'Planner' }, { name: 'Builder' }],
            },
            { name: 'Shell', panes: [{ name: 'Shell' }] },
          ],
        },
      ],
    })
  })

  it('rejects unknown window refs', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const configPath = path.join(tempRoot, 'config.json')

    await mkdir(repoPath, { recursive: true })
    await writeJson(configPath, {
      windows: [{ name: 'Shell', panes: [{ name: 'Shell' }] }],
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: ['.'],
          windows: ['Missing'],
        },
      ],
    })

    const result = await runEither(loadConfigAtPath(configPath))

    expect(Either.isLeft(result)).toBe(true)
    if (!Either.isLeft(result)) {
      return
    }

    expect(result.left).toBeInstanceOf(InvalidConfigError)
    if (!(result.left instanceof InvalidConfigError)) {
      return
    }

    expect(result.left.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'unknown_window_ref' }),
      ]),
    )
  })

  it('rejects duplicate window names after project resolution', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const configPath = path.join(tempRoot, 'config.json')

    await mkdir(repoPath, { recursive: true })
    await writeJson(configPath, {
      windows: [{ name: 'Shell', panes: [{ name: 'Shell' }] }],
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: ['.'],
          windows: ['Shell', { name: 'Shell', panes: [{ name: 'Other' }] }],
        },
      ],
    })

    const result = await runEither(loadConfigAtPath(configPath))

    expect(Either.isLeft(result)).toBe(true)
    if (!Either.isLeft(result)) {
      return
    }

    expect(result.left).toBeInstanceOf(InvalidConfigError)
    if (!(result.left instanceof InvalidConfigError)) {
      return
    }

    expect(result.left.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'duplicate_window_name' }),
      ]),
    )
  })

  it('rejects duplicate pane names', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const configPath = path.join(tempRoot, 'config.json')

    await mkdir(repoPath, { recursive: true })
    await writeJson(configPath, {
      windows: [
        {
          name: 'Dev',
          panes: [{ name: 'Server' }, { name: 'Server' }],
        },
      ],
      projects: [
        {
          name: 'alpha',
          repo: repoPath,
          modules: ['.'],
        },
      ],
    })

    const result = await runEither(loadConfigAtPath(configPath))

    expect(Either.isLeft(result)).toBe(true)
    if (!Either.isLeft(result)) {
      return
    }

    expect(result.left).toBeInstanceOf(InvalidConfigError)
    if (!(result.left instanceof InvalidConfigError)) {
      return
    }

    expect(result.left.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'duplicate_pane_name' }),
      ]),
    )
  })
})

async function runEither(effect: ReturnType<typeof loadConfigAtPath>) {
  return Effect.runPromise(Effect.either(effect))
}

async function runSuccess(effect: ReturnType<typeof loadConfigAtPath>) {
  return Effect.runPromise(effect)
}

function expectLeft(
  result: Awaited<ReturnType<typeof runEither>>,
  ErrorType: abstract new (...args: never[]) => Error,
  shape: Record<string, unknown>,
) {
  expect(Either.isLeft(result)).toBe(true)
  if (!Either.isLeft(result)) {
    return
  }

  expect(result.left).toBeInstanceOf(ErrorType)
  expect(result.left).toMatchObject(shape)
}

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(tmpdir(), 'harbour-config-'))
  tempRoots.push(tempRoot)
  return tempRoot
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, JSON.stringify(value, null, 2), 'utf8')
}
