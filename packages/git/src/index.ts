import { execFile } from 'node:child_process'
import { realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

import { Effect } from 'effect'
import {
  RepoNotFoundError,
  RepoNotGitError,
  RepoNotSupportedError,
} from './errors'

export {
  RepoNotFoundError,
  RepoNotGitError,
  RepoNotSupportedError,
} from './errors'
export type { RepoInspectionError } from './errors'

const execFileAsync = promisify(execFile)

export type RepoKind = 'bare' | 'standard'

export type RepoInspection = {
  repoPath: string
  kind: RepoKind
}

type WorktreeEntry = {
  path: string
  isBare: boolean
}

export function inspectRepo(repoPath: string) {
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

export function resolveWorkspacePath(repo: RepoInspection) {
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
  })
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

async function parseWorktreeList(output: string) {
  const entries: WorktreeEntry[] = []
  const blocks = output.trim().split(/\n\s*\n/).filter(Boolean)

  for (const block of blocks) {
    const lines = block.split('\n')
    const worktreeLine = lines.find((line) => line.startsWith('worktree '))

    if (!worktreeLine) {
      continue
    }

    const worktreePath = worktreeLine.slice('worktree '.length)

    entries.push({
      path: await realpath(worktreePath),
      isBare: lines.includes('bare'),
    })
  }

  return entries
}

async function isDirectory(targetPath: string) {
  try {
    const targetStat = await stat(targetPath)
    return targetStat.isDirectory()
  } catch {
    return false
  }
}
