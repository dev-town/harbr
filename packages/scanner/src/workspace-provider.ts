import { homedir } from 'node:os'
import path from 'node:path'

import type { WorkspaceKind } from '@harbr/domain'

export type WorkspaceProviderDetectionInput = {
  readonly branchName: string | null
  readonly homePath?: string
  readonly kind: WorkspaceKind
  readonly repoPath: string
  readonly workspacePath: string
}

export function detectWorkspaceProvider({
  branchName,
  homePath = homedir(),
  kind,
  repoPath,
  workspacePath,
}: WorkspaceProviderDetectionInput) {
  if (kind === 'default') {
    return 'local'
  }

  const managedRoots = [
    ['harbr', path.join(homePath, '.local', 'share', 'harbr', 'worktrees')],
    ['codex', path.join(homePath, '.codex', 'worktrees')],
    ['claude', path.join(homePath, '.claude', 'worktrees')],
    [
      'opencode',
      path.join(homePath, '.local', 'share', 'opencode', 'worktree'),
    ],
  ] as const

  for (const [provider, root] of managedRoots) {
    if (isWithin(root, workspacePath)) {
      return provider
    }
  }

  if (isAmpWorkspace({ branchName, homePath, repoPath, workspacePath })) {
    return 'amp'
  }

  return 'external'
}

function isAmpWorkspace(input: {
  readonly branchName: string | null
  readonly homePath: string
  readonly repoPath: string
  readonly workspacePath: string
}) {
  const repoName = path.basename(input.repoPath).replace(/\.git$/, '')
  const projectsRoot = path.join(input.homePath, 'projects')
  const groupedRoot = path.join(projectsRoot, `${repoName}-worktrees`)

  if (isWithin(groupedRoot, input.workspacePath)) {
    return true
  }

  if (!input.branchName) {
    return false
  }

  const branchSegment = input.branchName.replaceAll('/', '-')
  return (
    path.resolve(input.workspacePath) ===
    path.join(projectsRoot, `${repoName}-${branchSegment}`)
  )
}

function isWithin(root: string, target: string) {
  const relative = path.relative(path.resolve(root), path.resolve(target))
  return (
    relative.length > 0 &&
    !relative.startsWith('..') &&
    !path.isAbsolute(relative)
  )
}
