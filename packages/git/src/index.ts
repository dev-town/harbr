import { execFile } from 'node:child_process'
import { stat } from 'node:fs/promises'
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

async function isDirectory(targetPath: string) {
  try {
    const targetStat = await stat(targetPath)
    return targetStat.isDirectory()
  } catch {
    return false
  }
}
