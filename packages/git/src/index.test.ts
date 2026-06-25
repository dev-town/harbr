import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import { Either, Effect } from 'effect'
import { afterEach, describe, expect, it } from 'vitest'

import {
  DefaultBranchNotFoundError,
  GitService,
  GitServiceLive,
  RepoNotFoundError,
  RepoNotGitError,
  RepoNotSupportedError,
  type RepoInspection,
} from './index'
import type { CreateWorktreeInput } from '@harbr/domain'

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

    await execFileAsync('git', ['init', '-b', 'main', repoPath])

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

    await execFileAsync('git', ['init', '-b', 'main', repoPath])
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

describe('resolveWorkspacePath', () => {
  it('returns repo path for standard repos', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')

    await execFileAsync('git', ['init', '-b', 'main', repoPath])

    await expect(
      runWorkspaceSuccess(resolveWorkspacePath({ repoPath, kind: 'standard' })),
    ).resolves.toBe(repoPath)
  })

  it('returns first linked worktree path for bare repos', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo.git')
    const mainPath = path.join(tempRoot, 'main')
    const worktreePath = path.join(tempRoot, 'feature')

    await execFileAsync('git', ['init', '--bare', repoPath])
    await execFileAsync('git', ['clone', repoPath, mainPath])
    await execFileAsync('git', [
      '-C',
      mainPath,
      '-c',
      'user.name=Test',
      '-c',
      'user.email=test@example.com',
      'commit',
      '--allow-empty',
      '-m',
      'init',
    ])
    await execFileAsync('git', ['-C', mainPath, 'push', 'origin', 'HEAD'])
    await execFileAsync('git', [
      '--git-dir',
      repoPath,
      'worktree',
      'add',
      worktreePath,
      'master',
    ])

    const expectedWorkspacePath = await realpath(worktreePath)

    await expect(
      runWorkspaceSuccess(resolveWorkspacePath({ repoPath, kind: 'bare' })),
    ).resolves.toBe(expectedWorkspacePath)
  })

  it('returns null when bare repo has no linked worktrees', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo.git')

    await execFileAsync('git', ['init', '--bare', repoPath])

    await expect(
      runWorkspaceSuccess(resolveWorkspacePath({ repoPath, kind: 'bare' })),
    ).resolves.toBeNull()
  })
})

describe('getDefaultBranch', () => {
  it('returns current head when remote head is missing', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')

    await execFileAsync('git', ['init', '-b', 'trunk', repoPath])

    await expect(
      Effect.runPromise(
        getDefaultBranch({ repoPath, kind: 'standard' }).pipe(
          Effect.provide(GitServiceLive),
        ),
      ),
    ).resolves.toBe('trunk')
  })

  it('fails when repo head is detached', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')

    await execFileAsync('git', ['init', '-b', 'main', repoPath])
    await execFileAsync('git', [
      '-C',
      repoPath,
      '-c',
      'user.name=Test',
      '-c',
      'user.email=test@example.com',
      'commit',
      '--allow-empty',
      '-m',
      'init',
    ])
    await execFileAsync('git', ['-C', repoPath, 'checkout', 'HEAD~0'])

    const result = await Effect.runPromise(
      Effect.either(getDefaultBranch({ repoPath, kind: 'standard' })).pipe(
        Effect.provide(GitServiceLive),
      ),
    )

    expectLeft(result, DefaultBranchNotFoundError, { repoPath })
  })

  it('fails when bare repo head points at a missing branch', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo.git')

    await execFileAsync('git', ['init', '--bare', repoPath])

    const result = await Effect.runPromise(
      Effect.either(getDefaultBranch({ repoPath, kind: 'bare' })).pipe(
        Effect.provide(GitServiceLive),
      ),
    )

    expectLeft(result, DefaultBranchNotFoundError, {
      message: `Repo HEAD points to missing branch refs/heads/master`,
      repoPath,
    })
  })
})

describe('createWorktree', () => {
  it('creates a linked worktree from workspace and branch names', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')

    await execFileAsync('git', ['init', repoPath])
    await execFileAsync('git', [
      '-C',
      repoPath,
      '-c',
      'user.name=Test',
      '-c',
      'user.email=test@example.com',
      'commit',
      '--allow-empty',
      '-m',
      'init',
    ])

    const created = await Effect.runPromise(
      createWorktree(
        { repoPath, kind: 'standard' },
        { workspaceName: 'auth', branchName: 'feat/auth' },
      ).pipe(Effect.provide(GitServiceLive)),
    )
    const defaultBranch = await Effect.runPromise(
      getDefaultBranch({ repoPath, kind: 'standard' }).pipe(
        Effect.provide(GitServiceLive),
      ),
    )

    expect(created).toMatchObject({
      branchName: 'feat/auth',
      kind: 'worktree',
      name: 'auth',
    })
    await expect(
      runWorkspacesSuccess(listWorkspaces({ repoPath, kind: 'standard' })),
    ).resolves.toEqual([
      {
        branchName: defaultBranch,
        name: 'main',
        path: repoPath,
        kind: 'default',
      },
      {
        branchName: 'feat/auth',
        name: 'auth',
        path: created.path,
        kind: 'worktree',
      },
    ])
  })
})

describe('listWorkspaces', () => {
  it('lists default workspace for standard repos', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')

    await execFileAsync('git', ['init', '-b', 'main', repoPath])

    await expect(
      runWorkspacesSuccess(listWorkspaces({ repoPath, kind: 'standard' })),
    ).resolves.toEqual([
      {
        branchName: 'main',
        name: 'main',
        path: repoPath,
        kind: 'default',
      },
    ])
  })

  it('lists default repo plus linked worktrees for standard repos', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const worktreePath = path.join(tempRoot, 'feature-auth')

    await execFileAsync('git', ['init', '-b', 'main', repoPath])
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
      '-b',
      'feature/auth',
      worktreePath,
    ])

    const expectedWorktreePath = await realpath(worktreePath)

    await expect(
      runWorkspacesSuccess(listWorkspaces({ repoPath, kind: 'standard' })),
    ).resolves.toEqual([
      {
        branchName: 'main',
        name: 'main',
        path: repoPath,
        kind: 'default',
      },
      {
        branchName: 'feature/auth',
        name: 'feature-auth',
        path: expectedWorktreePath,
        kind: 'worktree',
      },
    ])
  })
})

async function runEither(effect: ReturnType<typeof inspectRepo>) {
  return Effect.runPromise(
    Effect.either(effect).pipe(Effect.provide(GitServiceLive)),
  )
}

function inspectRepo(repoPath: string) {
  return Effect.flatMap(GitService, (service) => service.inspectRepo(repoPath))
}

function resolveWorkspacePath(repo: RepoInspection) {
  return Effect.flatMap(GitService, (service) =>
    service.resolveWorkspacePath(repo),
  )
}

function listWorkspaces(repo: RepoInspection) {
  return Effect.flatMap(GitService, (service) => service.listWorkspaces(repo))
}

function getDefaultBranch(repo: RepoInspection) {
  return Effect.flatMap(GitService, (service) => service.getDefaultBranch(repo))
}

function createWorktree(repo: RepoInspection, input: CreateWorktreeInput) {
  return Effect.flatMap(GitService, (service) =>
    service.createWorktree(repo, input),
  )
}

async function runSuccess(effect: ReturnType<typeof inspectRepo>) {
  return Effect.runPromise(effect.pipe(Effect.provide(GitServiceLive)))
}

async function runWorkspaceSuccess(
  effect: ReturnType<typeof resolveWorkspacePath>,
) {
  return Effect.runPromise(effect.pipe(Effect.provide(GitServiceLive)))
}

async function runWorkspacesSuccess(effect: ReturnType<typeof listWorkspaces>) {
  return Effect.runPromise(effect.pipe(Effect.provide(GitServiceLive)))
}

function expectLeft<TLeft extends Error, TRight>(
  result: Either.Either<TRight, TLeft>,
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
