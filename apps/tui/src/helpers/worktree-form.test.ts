import { describe, expect, it } from 'vitest'

import { validateBranchName, validateWorkspaceName } from './worktree-form'

describe('worktree form helpers', () => {
  it('allows trailing dash and underscore in workspace names', () => {
    expect(validateWorkspaceName('auth-')).toBeNull()
    expect(validateWorkspaceName('auth_')).toBeNull()
  })

  it('accepts copied branch defaults from valid workspace names', () => {
    expect(validateBranchName('auth-')).toBeNull()
    expect(validateBranchName('auth_')).toBeNull()
  })

  it('still rejects spaces and slashes in workspace names', () => {
    expect(validateWorkspaceName('auth work')).toBe(
      'Use letters, numbers, - or _ only',
    )
    expect(validateWorkspaceName('auth/work')).toBe(
      'Use letters, numbers, - or _ only',
    )
  })
})
