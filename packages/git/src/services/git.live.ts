import { execFile } from 'node:child_process'
import { stat } from 'node:fs/promises'
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
import type { RepoInspection } from '../git.types'
import { parseWorktreeList } from '../git.worktree'

const execFileAsync = promisify(execFile)

export const GitServiceLive = Layer.succeed(GitService, {
  inspectRepo: inspectRepoLive,
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
  if (repo.kind === 'standard') {
    return Effect.succeed(repo.repoPath)
  }

  return Effect.tryPromise({
    try: async () => {
      const worktrees = await listWorktrees(repo.repoPath)
      return worktrees.find((worktree) => !worktree.isBare)?.path ?? null
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

async function listWorktrees(repoPath: string) {
  const { stdout } = await execFileAsync('git', [
    '--git-dir',
    repoPath,
    'worktree',
    'list',
    '--porcelain',
  ])

  return parseWorktreeList(stdout)
}

async function isDirectory(targetPath: string) {
  try {
    const targetStat = await stat(targetPath)
    return targetStat.isDirectory()
  } catch {
    return false
  }
}
