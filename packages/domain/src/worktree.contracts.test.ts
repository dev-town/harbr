import { describe, expect, it } from 'vitest'

import {
  BranchNameSchema,
  CreateWorktreeInputSchema,
  WorkspaceNameSchema,
} from './worktree.contracts'

describe('worktree contracts', () => {
  it('accepts workspace names with letters numbers dashes and underscores', () => {
    expect(WorkspaceNameSchema.safeParse('auth-123_').success).toBe(true)
  })

  it('rejects workspace names with spaces or slashes', () => {
    const spaced = WorkspaceNameSchema.safeParse('auth work')
    const slashed = WorkspaceNameSchema.safeParse('auth/work')

    expect(spaced.success).toBe(false)
    expect(slashed.success).toBe(false)

    if (!spaced.success && !slashed.success) {
      expect(spaced.error.issues[0]?.message).toBe('Use letters, numbers, - or _ only')
      expect(slashed.error.issues[0]?.message).toBe('Use letters, numbers, - or _ only')
    }
  })

  it('accepts copied branch defaults from valid workspace names', () => {
    expect(BranchNameSchema.safeParse('auth-').success).toBe(true)
    expect(BranchNameSchema.safeParse('auth_').success).toBe(true)
    expect(BranchNameSchema.safeParse('feature/auth').success).toBe(true)
  })

  it('rejects invalid branch forms with friendly messages', () => {
    const result = BranchNameSchema.safeParse('feature auth')

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Branch name cannot contain spaces')
    }
  })

  it('validates create worktree input as one contract', () => {
    expect(
      CreateWorktreeInputSchema.safeParse({
        branchName: 'feature/auth',
        workspaceName: 'feature_auth',
      }).success,
    ).toBe(true)
  })
})
