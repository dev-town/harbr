import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import { Either, Effect } from 'effect'
import { afterEach, describe, expect, it } from 'vitest'

import {
  RepoNotFoundError,
  RepoNotGitError,
  RepoNotSupportedError,
  inspectRepo,
} from './index'

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

    await expect(runSuccess(inspectRepo(repoPath))).resolves.toEqual({
      repoPath,
      kind: 'standard',
    })
  })

  it('detects bare repos', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo.git')

    await execFileAsync('git', ['init', '--bare', repoPath])

    await expect(runSuccess(inspectRepo(repoPath))).resolves.toEqual({
      repoPath,
      kind: 'bare',
    })
  })

  it('returns repo_not_git for plain directories', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'not-git')

    await mkdir(repoPath, { recursive: true })

    const result = await runEither(inspectRepo(repoPath))

    expectLeft(result, RepoNotGitError, { repoPath })
  })

  it('returns repo_not_found for missing directories', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'missing')

    const result = await runEither(inspectRepo(repoPath))

    expectLeft(result, RepoNotFoundError, { repoPath })
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

    const result = await runEither(inspectRepo(worktreePath))

    expectLeft(result, RepoNotSupportedError, { repoPath: worktreePath })
  })
})

async function runEither(effect: ReturnType<typeof inspectRepo>) {
  return Effect.runPromise(Effect.either(effect))
}

async function runSuccess(effect: ReturnType<typeof inspectRepo>) {
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
  const tempRoot = await mkdtemp(path.join(tmpdir(), 'harbour-git-'))
  tempRoots.push(tempRoot)
  return tempRoot
}
