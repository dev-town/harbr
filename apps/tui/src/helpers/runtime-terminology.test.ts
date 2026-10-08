import { describe, expect, it } from 'vitest'

import { getCannotCloseCurrentRuntimeNotice, getCloseRuntimeLabel } from './runtime-terminology'

describe('runtime terminology', () => {
  it('describes Herdr runtimes as workspaces', () => {
    const identity = {
      displayLabel: 'Alpha',
      externalId: 'workspace-alpha',
      source: { provider: 'herdr', sourceId: '/tmp/herdr.sock' },
    }

    expect(getCloseRuntimeLabel(identity)).toBe('Close workspace')
    expect(getCannotCloseCurrentRuntimeNotice(identity)).toBe('Cannot close current workspace')
  })

  it('preserves tmux session wording', () => {
    const identity = {
      displayLabel: 'alpha',
      externalId: 'alpha',
      source: { provider: 'tmux', sourceId: '/tmp/tmux/default' },
    }

    expect(getCloseRuntimeLabel(identity)).toBe('Close session')
    expect(getCannotCloseCurrentRuntimeNotice(identity)).toBe('Cannot close current session')
  })
})
