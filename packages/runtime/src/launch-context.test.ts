import { describe, expect, it } from 'vitest'

import { resolveRuntimeProvider } from './launch-context'

describe('resolveRuntimeProvider', () => {
  it('selects tmux outside Herdr', () => {
    expect(resolveRuntimeProvider({ TMUX: '/tmp/tmux/default,1,0' })).toBe(
      'tmux',
    )
  })

  it('selects Herdr when launched from a Herdr workspace', () => {
    expect(
      resolveRuntimeProvider({
        HERDR_SOCKET_PATH: '/tmp/herdr.sock',
        HERDR_WORKSPACE_ID: 'workspace-1',
      }),
    ).toBe('herdr')
  })

  it('gives Herdr precedence when Herdr runs inside tmux', () => {
    expect(
      resolveRuntimeProvider({
        HERDR_SOCKET_PATH: '/tmp/herdr.sock',
        HERDR_WORKSPACE_ID: 'workspace-1',
        TMUX: '/tmp/tmux/default,1,0',
      }),
    ).toBe('herdr')
  })
})
