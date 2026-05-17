import { execFile } from 'node:child_process'
import { realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

import { Effect, Layer } from 'effect'
import type { RepoInspectionError } from '../git.errors'
import {
  RepoNotFoundError,
  RepoNotGitError,
  RepoNotSupportedError,
} from '../git.errors'
import { GitService, type GitServiceApi } from './git.service'
import type { RepoInspection, WorkspaceTarget } from '../git.types'
import { parseWorktreeList, type WorktreeEntry } from '../git.worktree'

const execFileAsync = promisify(execFile)

export const GitServiceLive = Layer.succeed(GitService, {
  inspectRepo: inspectRepoLive,
  listWorkspaces: listWorkspacesLive,
  resolveWorkspacePath: resolveWorkspacePathLive,
} satisfies GitServiceApi)

export function makeGitServiceLayer() {
  return GitServiceLive
}

export function inspectRepo(repoPath: string) {
  return Effect.flatMap(GitService, (service) => service.inspectRepo(repoPath)).pipe(
    Effect.provide(makeGitServiceLayer()),
  )
}

export function resolveWorkspacePath(repo: RepoInspection) {
  return Effect.flatMap(GitService, (service) =>
    service.resolveWorkspacePath(repo),
  ).pipe(Effect.provide(makeGitServiceLayer()))
}

export function listWorkspaces(repo: RepoInspection) {
  return Effect.flatMap(GitService, (service) => service.listWorkspaces(repo)).pipe(
    Effect.provide(makeGitServiceLayer()),
  )
}

function inspectRepoLive(repoPath: string) {
  const resolvedRepoPath = path.resolve(repoPath)

  return Effect.gen(function* () {
    const repoExists = yield* Effect.promise(() => isDirectory(resolvedRepoPath))

    if (!repoExists) {
      return yield* Effect.fail(
        new RepoNotFoundError({
          repoPath: resolvedRepoPath,
        }),
      )
    }

    const isBare = yield* runGitRevParse(resolvedRepoPath, '--is-bare-repository')

    if (isBare === 'true') {
      return {
        repoPath: resolvedRepoPath,
        kind: 'bare',
      } satisfies RepoInspection
    }

    const gitDir = yield* runGitRevParse(resolvedRepoPath, '--git-dir')

    if (
      gitDir !== '.git' ||
      !(yield* Effect.promise(() => isDirectory(path.join(resolvedRepoPath, '.git'))))
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
  return Effect.map(listWorkspacesLive(repo), (workspaces) => workspaces[0]?.path ?? null)
}

function listWorkspacesLive(repo: RepoInspection) {
  return Effect.tryPromise({
    try: async () => {
      const [worktrees, canonicalRepoPath] = await Promise.all([
        listWorktrees(repo),
        repo.kind === 'standard' ? realpath(repo.repoPath) : Promise.resolve(repo.repoPath),
      ])

      return mapWorkspaces(repo, canonicalRepoPath, worktrees)
    },
    catch: () =>
      new RepoNotGitError({
        repoPath: repo.repoPath,
      }),
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

async function listWorktrees(repo: RepoInspection) {
  const args =
    repo.kind === 'bare'
      ? ['--git-dir', repo.repoPath, 'worktree', 'list', '--porcelain']
      : ['-C', repo.repoPath, 'worktree', 'list', '--porcelain']

  const { stdout } = await execFileAsync('git', args)

  return parseWorktreeList(stdout)
}

function mapWorkspaces(
  repo: RepoInspection,
  canonicalRepoPath: string,
  worktrees: WorktreeEntry[],
): WorkspaceTarget[] {
  return worktrees
    .filter((worktree) => !worktree.isBare)
    .map((worktree) => ({
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
    }) satisfies WorkspaceTarget)
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
