import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import { afterEach, describe, expect, it } from 'vitest'

import { inspectRepo } from './index'

const execFileAsync = promisify(execFile)
const tempRoots: string[] = []

afterEach(async () => {
  await Promise.all(
    tempRoots
      .splice(0)
      .map((tempRoot) => rm(tempRoot, { force: true, recursive: true })),
  )
})

describe('inspectRepo', () => {
  it('detects standard repos', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')

    await execFileAsync('git', ['init', repoPath])

    await expect(inspectRepo(repoPath)).resolves.toEqual({
      ok: true,
      value: {
        repoPath,
        kind: 'standard',
      },
    })
  })

  it('detects bare repos', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo.git')

    await execFileAsync('git', ['init', '--bare', repoPath])

    await expect(inspectRepo(repoPath)).resolves.toEqual({
      ok: true,
      value: {
        repoPath,
        kind: 'bare',
      },
    })
  })

  it('returns repo_not_git for plain directories', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'not-git')

    await mkdir(repoPath, { recursive: true })

    await expect(inspectRepo(repoPath)).resolves.toEqual({
      ok: false,
      error: {
        code: 'repo_not_git',
        repoPath,
      },
    })
  })

  it('returns repo_not_found for missing directories', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'missing')

    await expect(inspectRepo(repoPath)).resolves.toEqual({
      ok: false,
      error: {
        code: 'repo_not_found',
        repoPath,
      },
    })
  })

  it('returns repo_not_supported for linked worktree roots', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const worktreePath = path.join(tempRoot, 'worktree')

    await execFileAsync('git', ['init', repoPath])
    await writeFile(path.join(repoPath, 'README.md'), 'hello\n', 'utf8')
    await execFileAsync('git', [
      '-C',
      repoPath,
      '-c',
      'user.name=Test',
      '-c',
      'user.email=test@example.com',
      'add',
      'README.md',
    ])
    await execFileAsync('git', [
      '-C',
      repoPath,
      '-c',
      'user.name=Test',
      '-c',
      'user.email=test@example.com',
      'commit',
      '-m',
      'init',
    ])
    await execFileAsync('git', [
      '-C',
      repoPath,
      'worktree',
      'add',
      worktreePath,
    ])

    await expect(inspectRepo(worktreePath)).resolves.toEqual({
      ok: false,
      error: {
        code: 'repo_not_supported',
        repoPath: worktreePath,
      },
    })
  })
})

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(tmpdir(), 'harbour-git-'))
  tempRoots.push(tempRoot)
  return tempRoot
}
