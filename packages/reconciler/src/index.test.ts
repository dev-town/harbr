import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import { openDatabase, getProjectByName } from '@harbour/db'
import { Effect } from 'effect'
import { afterEach, describe, expect, it } from 'vitest'

import { refreshProject, sync } from './index'

const execFileAsync = promisify(execFile)
const tempRoots: string[] = []

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { recursive: true, force: true })),
  )
})

describe('reconciler', () => {
  it('syncs configured projects and persists snapshots', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const configPath = path.join(tempRoot, 'harbour.json')
    const dbPath = path.join(tempRoot, 'harbour.db')

    await execFileAsync('git', ['init', repoPath])
    await mkdir(path.join(repoPath, 'apps', 'cli'), { recursive: true })
    await writeFile(
      configPath,
      JSON.stringify({
        projects: [
          {
            name: 'alpha',
            repo: repoPath,
            modules: ['apps/'],
          },
        ],
      }),
      'utf8',
    )

    const result = await Effect.runPromise(sync({ configPath, dbPath }))

    expect(result.projects).toEqual([
      {
        projectName: 'alpha',
        repoPath,
        repoKind: 'standard',
        workspacePath: repoPath,
        moduleCount: 1,
        status: 'synced',
        errorTag: null,
      },
    ])

    const database = await openDatabase(dbPath)
    try {
      const project = await getProjectByName(database.db, 'alpha')
      expect(project?.repoPath).toBe(repoPath)
    } finally {
      database.sqlite.close()
    }
  })

  it('persists project only when bare repo has no linked workspace', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo.git')
    const configPath = path.join(tempRoot, 'harbour.json')
    const dbPath = path.join(tempRoot, 'harbour.db')

    await execFileAsync('git', ['init', '--bare', repoPath])
    await writeFile(
      configPath,
      JSON.stringify({
        projects: [
          {
            name: 'alpha',
            repo: repoPath,
            modules: ['docs'],
          },
        ],
      }),
      'utf8',
    )

    const result = await Effect.runPromise(refreshProject('alpha', { configPath, dbPath }))

    expect(result).toEqual({
      projectName: 'alpha',
      repoPath,
      repoKind: 'bare',
      workspacePath: null,
      moduleCount: 0,
      status: 'no_workspace',
      errorTag: null,
    })
  })

  it('isolates per-project failures during sync', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const plainDirPath = path.join(tempRoot, 'plain-dir')
    const configPath = path.join(tempRoot, 'harbour.json')
    const dbPath = path.join(tempRoot, 'harbour.db')

    await execFileAsync('git', ['init', repoPath])
    await mkdir(path.join(repoPath, 'docs'), { recursive: true })
    await mkdir(plainDirPath, { recursive: true })
    await writeFile(
      configPath,
      JSON.stringify({
        projects: [
          {
            name: 'alpha',
            repo: repoPath,
            modules: ['docs'],
          },
          {
            name: 'beta',
            repo: plainDirPath,
            modules: ['docs'],
          },
        ],
      }),
      'utf8',
    )

    const result = await Effect.runPromise(sync({ configPath, dbPath }))

    expect(result.projects).toEqual([
      {
        projectName: 'alpha',
        repoPath,
        repoKind: 'standard',
        workspacePath: repoPath,
        moduleCount: 1,
        status: 'synced',
        errorTag: null,
      },
      {
        projectName: 'beta',
        repoPath: plainDirPath,
        repoKind: null,
        workspacePath: null,
        moduleCount: 0,
        status: 'error',
        errorTag: 'RepoNotGitError',
      },
    ])
  })
})

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(tmpdir(), 'harbour-reconciler-'))
  tempRoots.push(tempRoot)
  return tempRoot
}
