import { execFile } from 'node:child_process'
import { realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

import type { CreateWorktreeInput } from '@harbr/domain'
import { Effect, Layer } from 'effect'
import type { RepoInspectionError, WorktreeMutationError } from '../git.errors'
import {
  DefaultBranchNotFoundError,
  InvalidBranchNameError,
  RepoNotFoundError,
  RepoNotGitError,
  RepoNotSupportedError,
  WorktreeCreateError,
} from '../git.errors'
import { GitService, type GitServiceApi } from './git.service'
import type { RepoInspection, WorkspaceTarget } from '../git.types'
import { parseWorktreeList, type WorktreeEntry } from '../git.worktree'

const execFileAsync = promisify(execFile)

export const GitServiceLive = Layer.succeed(GitService, {
  createWorktree: createWorktreeLive,
  getDefaultBranchIssue: getDefaultBranchIssueLive,
  getDefaultBranch: getDefaultBranchLive,
  inspectRepo: inspectRepoLive,
  listWorkspaces: listWorkspacesLive,
  resolveWorkspacePath: resolveWorkspacePathLive,
} satisfies GitServiceApi)

export function makeGitServiceLayer() {
  return GitServiceLive
}

export function inspectRepo(repoPath: string) {
  return Effect.flatMap(GitService, (service) =>
    service.inspectRepo(repoPath),
  ).pipe(Effect.provide(makeGitServiceLayer()))
}

export function resolveWorkspacePath(repo: RepoInspection) {
  return Effect.flatMap(GitService, (service) =>
    service.resolveWorkspacePath(repo),
  ).pipe(Effect.provide(makeGitServiceLayer()))
}

export function getDefaultBranch(repo: RepoInspection) {
  return Effect.flatMap(GitService, (service) =>
    service.getDefaultBranch(repo),
  ).pipe(Effect.provide(makeGitServiceLayer()))
}

export function getDefaultBranchIssue(repo: RepoInspection) {
  return Effect.flatMap(GitService, (service) =>
    service.getDefaultBranchIssue(repo),
  ).pipe(Effect.provide(makeGitServiceLayer()))
}

export function listWorkspaces(repo: RepoInspection) {
  return Effect.flatMap(GitService, (service) =>
    service.listWorkspaces(repo),
  ).pipe(Effect.provide(makeGitServiceLayer()))
}

export function createWorktree(
  repo: RepoInspection,
  input: CreateWorktreeInput,
) {
  return Effect.flatMap(GitService, (service) =>
    service.createWorktree(repo, input),
  ).pipe(Effect.provide(makeGitServiceLayer()))
}

function inspectRepoLive(repoPath: string) {
  const resolvedRepoPath = path.resolve(repoPath)

  return Effect.gen(function* () {
    const repoExists = yield* Effect.promise(() =>
      isDirectory(resolvedRepoPath),
    )

    if (!repoExists) {
      return yield* Effect.fail(
        new RepoNotFoundError({
          repoPath: resolvedRepoPath,
        }),
      )
    }

    const isBare = yield* runGitRevParse(
      resolvedRepoPath,
      '--is-bare-repository',
    )

    if (isBare === 'true') {
      return {
        repoPath: resolvedRepoPath,
        kind: 'bare',
      } satisfies RepoInspection
    }

    const gitDir = yield* runGitRevParse(resolvedRepoPath, '--git-dir')

    if (
      gitDir !== '.git' ||
      !(yield* Effect.promise(() =>
        isDirectory(path.join(resolvedRepoPath, '.git')),
      ))
    ) {
      return yield* Effect.fail(
        new RepoNotSupportedError({
          repoPath: resolvedRepoPath,
        }),
      )
    }

    return {
      repoPath: resolvedRepoPath,
      kind: 'standard',
    } satisfies RepoInspection
  })
}

function resolveWorkspacePathLive(repo: RepoInspection) {
  return Effect.map(
    listWorkspacesLive(repo),
    (workspaces) => workspaces[0]?.path ?? null,
  )
}

function getDefaultBranchLive(repo: RepoInspection) {
  return Effect.tryPromise({
    try: () => resolveDefaultBranchStartPoint(repo),
    catch: (error) =>
      error instanceof DefaultBranchNotFoundError
        ? error
        : new DefaultBranchNotFoundError({
            message: `Could not detect default branch for ${repo.repoPath}`,
            repoPath: repo.repoPath,
          }),
  })
}

function getDefaultBranchIssueLive(repo: RepoInspection) {
  return Effect.tryPromise({
    try: async () => {
      try {
        await resolveDefaultBranchStartPoint(repo)
        return null
      } catch (error) {
        if (error instanceof DefaultBranchNotFoundError) {
          return error.message
        }

        throw error
      }
    },
    catch: () => new RepoNotGitError({ repoPath: repo.repoPath }),
  })
}

function listWorkspacesLive(repo: RepoInspection) {
  return Effect.tryPromise({
    try: async () => {
      const [worktrees, canonicalRepoPath] = await Promise.all([
        listWorktrees(repo),
        repo.kind === 'standard'
          ? realpath(repo.repoPath)
          : Promise.resolve(repo.repoPath),
      ])

      return mapWorkspaces(repo, canonicalRepoPath, worktrees)
    },
    catch: () =>
      new RepoNotGitError({
        repoPath: repo.repoPath,
      }),
  })
}

function createWorktreeLive(repo: RepoInspection, input: CreateWorktreeInput) {
  return Effect.gen(function* () {
    yield* validateBranchName(repo, input.branchName)

    const defaultBranch = yield* getDefaultBranchLive(repo)
    const workspacePath = path.join(
      path.dirname(repo.repoPath),
      input.workspaceName,
    )

    yield* Effect.tryPromise({
      try: () =>
        execFileAsync(
          'git',
          getGitArgs(repo, [
            'worktree',
            'add',
            '-b',
            input.branchName,
            workspacePath,
            defaultBranch,
          ]),
        ),
      catch: (error) =>
        new WorktreeCreateError({
          message: error instanceof Error ? error.message : String(error),
          repoPath: repo.repoPath,
        }),
    })

    const resolvedWorkspacePath = yield* Effect.tryPromise({
      try: () => realpath(workspacePath),
      catch: (error) =>
        new WorktreeCreateError({
          message: error instanceof Error ? error.message : String(error),
          repoPath: repo.repoPath,
        }),
    })

    return {
      branchName: input.branchName,
      kind: 'worktree',
      name: input.workspaceName,
      path: resolvedWorkspacePath,
    } satisfies WorkspaceTarget
  })
}

function runGitRevParse(repoPath: string, flag: string) {
  return Effect.tryPromise({
    try: async () => {
      const { stdout } = await execFileAsync('git', [
        '-C',
        repoPath,
        'rev-parse',
        flag,
      ])
      return stdout.trim()
    },
    catch: () =>
      new RepoNotGitError({
        repoPath,
      }),
  }) as Effect.Effect<string, RepoInspectionError>
}

async function runGitSymbolicRef(repo: RepoInspection, ref: string) {
  const { stdout } = await execFileAsync(
    'git',
    getGitArgs(repo, ['symbolic-ref', '--quiet', '--short', ref]),
  )

  return stdout.trim()
}

function validateBranchName(repo: RepoInspection, branchName: string) {
  return Effect.tryPromise({
    try: async () => {
      await execFileAsync(
        'git',
        getGitArgs(repo, ['check-ref-format', '--branch', branchName]),
      )
      return branchName
    },
    catch: () => new InvalidBranchNameError({ branchName }),
  }) as Effect.Effect<string, WorktreeMutationError>
}

async function resolveDefaultBranchStartPoint(repo: RepoInspection) {
  if (repo.kind === 'bare') {
    const headRef = await runGitSymbolicRefFull(repo, 'HEAD').catch(() => null)

    if (!headRef) {
      throw new DefaultBranchNotFoundError({
        message: `Could not detect default branch for ${repo.repoPath}`,
        repoPath: repo.repoPath,
      })
    }

    const hasHeadRef = await hasGitRef(repo, headRef)

    if (!hasHeadRef) {
      throw new DefaultBranchNotFoundError({
        message: `Repo HEAD points to missing branch ${headRef}`,
        repoPath: repo.repoPath,
      })
    }

    return headRef
  }

  const remoteHead = await runGitSymbolicRef(
    repo,
    'refs/remotes/origin/HEAD',
  ).catch(() => null)

  if (remoteHead) {
    const remoteHeadRef = `refs/remotes/${remoteHead}`

    if (await hasGitRef(repo, remoteHeadRef)) {
      return remoteHead
    }
  }

  const head = await runGitSymbolicRef(repo, 'HEAD').catch(() => null)

  if (head) {
    return head
  }

  throw new DefaultBranchNotFoundError({
    message: `Could not detect default branch for ${repo.repoPath}`,
    repoPath: repo.repoPath,
  })
}

async function runGitSymbolicRefFull(repo: RepoInspection, ref: string) {
  const { stdout } = await execFileAsync(
    'git',
    getGitArgs(repo, ['symbolic-ref', '--quiet', ref]),
  )

  return stdout.trim()
}

async function hasGitRef(repo: RepoInspection, ref: string) {
  try {
    await execFileAsync(
      'git',
      getGitArgs(repo, ['show-ref', '--verify', '--quiet', ref]),
    )
    return true
  } catch {
    return false
  }
}

async function listWorktrees(repo: RepoInspection) {
  const { stdout } = await execFileAsync(
    'git',
    getGitArgs(repo, ['worktree', 'list', '--porcelain']),
  )

  return parseWorktreeList(stdout)
}

function getGitArgs(repo: RepoInspection, args: string[]) {
  return repo.kind === 'bare'
    ? ['--git-dir', repo.repoPath, ...args]
    : ['-C', repo.repoPath, ...args]
}

function mapWorkspaces(
  repo: RepoInspection,
  canonicalRepoPath: string,
  worktrees: WorktreeEntry[],
): WorkspaceTarget[] {
  return worktrees
    .filter((worktree) => !worktree.isBare)
    .map(
      (worktree) =>
        ({
          branchName: worktree.branchName,
          path:
            repo.kind === 'standard' && worktree.path === canonicalRepoPath
              ? repo.repoPath
              : worktree.path,
          kind:
            repo.kind === 'standard' && worktree.path === canonicalRepoPath
              ? 'default'
              : 'worktree',
          name:
            repo.kind === 'standard' && worktree.path === canonicalRepoPath
              ? 'main'
              : path.basename(worktree.path),
        }) satisfies WorkspaceTarget,
    )
    .sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === 'default' ? -1 : 1
      }

      return left.name.localeCompare(right.name)
    })
}

async function isDirectory(targetPath: string) {
  try {
    const targetStat = await stat(targetPath)
    return targetStat.isDirectory()
  } catch {
    return false
  }
}
