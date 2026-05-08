import { stat } from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export type RepoKind = 'bare' | 'standard'

export type RepoInspectionErrorCode =
  | 'repo_not_found'
  | 'repo_not_git'
  | 'repo_not_supported'

export type RepoInspectionResult =
  | {
      ok: true
      value: {
        repoPath: string
        kind: RepoKind
      }
    }
  | {
      ok: false
      error: {
        code: RepoInspectionErrorCode
        repoPath: string
      }
    }

export async function inspectRepo(
  repoPath: string,
): Promise<RepoInspectionResult> {
  const resolvedRepoPath = path.resolve(repoPath)

  if (!(await isDirectory(resolvedRepoPath))) {
    return {
      ok: false,
      error: {
        code: 'repo_not_found',
        repoPath: resolvedRepoPath,
      },
    }
  }

  const isBare = await runGitRevParse(resolvedRepoPath, '--is-bare-repository')

  if (!isBare.ok) {
    return {
      ok: false,
      error: {
        code: 'repo_not_git',
        repoPath: resolvedRepoPath,
      },
    }
  }

  if (isBare.value === 'true') {
    return {
      ok: true,
      value: {
        repoPath: resolvedRepoPath,
        kind: 'bare',
      },
    }
  }

  const gitDir = await runGitRevParse(resolvedRepoPath, '--git-dir')

  if (!gitDir.ok) {
    return {
      ok: false,
      error: {
        code: 'repo_not_git',
        repoPath: resolvedRepoPath,
      },
    }
  }

  if (
    gitDir.value !== '.git' ||
    !(await isDirectory(path.join(resolvedRepoPath, '.git')))
  ) {
    return {
      ok: false,
      error: {
        code: 'repo_not_supported',
        repoPath: resolvedRepoPath,
      },
    }
  }

  return {
    ok: true,
    value: {
      repoPath: resolvedRepoPath,
      kind: 'standard',
    },
  }
}

async function runGitRevParse(repoPath: string, flag: string) {
  try {
    const { stdout } = await execFileAsync('git', [
      '-C',
      repoPath,
      'rev-parse',
      flag,
    ])

    return {
      ok: true,
      value: stdout.trim(),
    } as const
  } catch {
    return {
      ok: false,
    } as const
  }
}

async function isDirectory(targetPath: string) {
  try {
    const targetStat = await stat(targetPath)
    return targetStat.isDirectory()
  } catch {
    return false
  }
}
