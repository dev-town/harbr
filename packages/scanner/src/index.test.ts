import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import type { ProjectConfig } from '@harbour/domain'
import { Effect } from 'effect'
import { afterEach, describe, expect, it } from 'vitest'

import { resolveProjectModules } from './index'

const tempRoots: string[] = []

afterEach(async () => {
  await Promise.all(
    tempRoots
      .splice(0)
      .map((tempRoot) => rm(tempRoot, { force: true, recursive: true })),
  )
})

describe('resolveProjectModules', () => {
  it('resolves explicit selectors as one module', async () => {
    const tempRoot = await createTempRoot()
    const workspacePath = path.join(tempRoot, 'workspace')

    await mkdir(workspacePath, { recursive: true })

    const project = createProject([{ raw: 'apps', path: 'apps', mode: 'explicit' }])

    await expect(runSuccess(resolveProjectModules(project, workspacePath))).resolves
      .toEqual([
        {
          name: 'apps',
          path: 'apps',
          workspacePath: path.join(workspacePath, 'apps'),
          selector: { raw: 'apps', path: 'apps', mode: 'explicit' },
        },
      ])
  })

  it('expands children selectors to immediate child dirs only', async () => {
    const tempRoot = await createTempRoot()
    const workspacePath = path.join(tempRoot, 'workspace')

    await mkdir(path.join(workspacePath, 'apps', 'cli'), { recursive: true })
    await mkdir(path.join(workspacePath, 'apps', 'tui'), { recursive: true })
    await mkdir(path.join(workspacePath, 'apps', 'cli', 'nested'), {
      recursive: true,
    })
    await writeFile(path.join(workspacePath, 'apps', 'README.md'), 'docs\n', 'utf8')

    const project = createProject([
      { raw: 'apps/', path: 'apps', mode: 'children' },
    ])

    await expect(runSuccess(resolveProjectModules(project, workspacePath))).resolves
      .toEqual([
        {
          name: 'apps/cli',
          path: 'apps/cli',
          workspacePath: path.join(workspacePath, 'apps', 'cli'),
          selector: { raw: 'apps/', path: 'apps', mode: 'children' },
        },
        {
          name: 'apps/tui',
          path: 'apps/tui',
          workspacePath: path.join(workspacePath, 'apps', 'tui'),
          selector: { raw: 'apps/', path: 'apps', mode: 'children' },
        },
      ])
  })

  it('uses workspace path instead of repo path', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo.git')
    const workspacePath = path.join(tempRoot, 'workspace')

    await mkdir(repoPath, { recursive: true })
    await mkdir(path.join(workspacePath, 'packages', 'config'), { recursive: true })
    await mkdir(path.join(workspacePath, 'packages', 'git'), { recursive: true })

    const project: ProjectConfig = {
      name: 'alpha',
      repo: repoPath,
      modules: [{ raw: 'packages/', path: 'packages', mode: 'children' }],
    }

    await expect(runSuccess(resolveProjectModules(project, workspacePath))).resolves
      .toEqual([
        {
          name: 'packages/config',
          path: 'packages/config',
          workspacePath: path.join(workspacePath, 'packages', 'config'),
          selector: { raw: 'packages/', path: 'packages', mode: 'children' },
        },
        {
          name: 'packages/git',
          path: 'packages/git',
          workspacePath: path.join(workspacePath, 'packages', 'git'),
          selector: { raw: 'packages/', path: 'packages', mode: 'children' },
        },
      ])
  })

  it('returns no modules when child selector dir is missing', async () => {
    const tempRoot = await createTempRoot()
    const workspacePath = path.join(tempRoot, 'workspace')

    await mkdir(workspacePath, { recursive: true })

    const project = createProject([
      { raw: 'packages/', path: 'packages', mode: 'children' },
    ])

    await expect(runSuccess(resolveProjectModules(project, workspacePath))).resolves
      .toEqual([])
  })
})

async function runSuccess(effect: ReturnType<typeof resolveProjectModules>) {
  return Effect.runPromise(effect)
}

function createProject(modules: ProjectConfig['modules']): ProjectConfig {
  return {
    name: 'alpha',
    repo: '/tmp/repo',
    modules,
  }
}

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(tmpdir(), 'harbour-scanner-'))
  tempRoots.push(tempRoot)
  return tempRoot
}
