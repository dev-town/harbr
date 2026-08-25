import { realpath } from 'node:fs/promises'

export type WorktreeEntry = {
  branchName: string | null
  path: string
  isBare: boolean
}

export async function parseWorktreeList(output: string) {
  const entries: WorktreeEntry[] = []
  const blocks = output
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean)

  for (const block of blocks) {
    const lines = block.split('\n')
    const worktreeLine = lines.find((line) => line.startsWith('worktree '))
    const isPrunable = lines.some(
      (line) => line === 'prunable' || line.startsWith('prunable '),
    )

    if (!worktreeLine || isPrunable) {
      continue
    }

    const worktreePath = worktreeLine.slice('worktree '.length)
    const branchLine = lines.find((line) =>
      line.startsWith('branch refs/heads/'),
    )

    entries.push({
      branchName: branchLine
        ? branchLine.slice('branch refs/heads/'.length)
        : null,
      path: await realpath(worktreePath),
      isBare: lines.includes('bare'),
    })
  }

  return entries
}
