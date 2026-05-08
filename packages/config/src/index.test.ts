import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { loadConfigAtPath } from './index'

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
    const result = await loadConfigAtPath(
      '/tmp/harbour-config-that-does-not-exist.json',
    )

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'config_not_found',
        configPath: '/tmp/harbour-config-that-does-not-exist.json',
      },
    })
  })

  it('returns invalid_json for bad json', async () => {
    const tempRoot = await createTempRoot()
    const configPath = path.join(tempRoot, 'config.json')

    await writeFile(configPath, '{bad json', 'utf8')

    const result = await loadConfigAtPath(configPath)

    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }

    expect(result.error.code).toBe('invalid_json')
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

    const result = await loadConfigAtPath(configPath)

    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }

    expect(result.error.code).toBe('invalid_config')
    if (result.error.code !== 'invalid_config') {
      return
    }

    expect(result.error.issues).toEqual(
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

    await expect(loadConfigAtPath(configPath)).resolves.toEqual({
      ok: true,
      value: {
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
          },
        ],
      },
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

    const result = await loadConfigAtPath(configPath)

    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }

    expect(result.error.code).toBe('invalid_config')
    if (result.error.code !== 'invalid_config') {
      return
    }

    expect(result.error.issues).toEqual(
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

    await expect(loadConfigAtPath(configPath)).resolves.toEqual({
      ok: true,
      value: {
        configPath,
        projects: [
          {
            name: 'alpha',
            repo: repoPath,
            modules: [
              { raw: 'packages/', path: 'packages', mode: 'children' },
              { raw: 'docs', path: 'docs', mode: 'explicit' },
            ],
          },
        ],
      },
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

    const result = await loadConfigAtPath(configPath)

    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }

    expect(result.error.code).toBe('invalid_config')
    if (result.error.code !== 'invalid_config') {
      return
    }

    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'module_path_not_relative' }),
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

    const result = await loadConfigAtPath(configPath)

    expect(result).toEqual({
      ok: true,
      value: {
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
          },
        ],
      },
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

    const result = await loadConfigAtPath(tildeConfigPath)

    expect(result).toEqual({
      ok: true,
      value: {
        configPath,
        projects: [
          {
            name: 'alpha',
            repo: repoPath,
            modules: [
              { raw: 'packages/', path: 'packages', mode: 'children' },
              { raw: 'docs', path: 'docs', mode: 'explicit' },
            ],
          },
        ],
      },
    })
  })
})

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(tmpdir(), 'harbour-config-'))
  tempRoots.push(tempRoot)
  return tempRoot
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, JSON.stringify(value, null, 2), 'utf8')
}
