import { afterEach, describe, expect, it, vi } from 'vitest'

import { createStartupTimeline } from './startup-timeline'

afterEach(() => vi.restoreAllMocks())

describe('startup timeline', () => {
  it('retains explicit and current milestone timestamps in order', () => {
    vi.spyOn(performance, 'now').mockReturnValueOnce(42)
    const timeline = createStartupTimeline({
      processStartedAt: 10,
      processStartedAtUnixNanos: 1_000_000n,
      tuiModuleLoadedAt: 20,
    })

    timeline.mark('app.entry', {}, 10)
    timeline.mark('renderer.ready', { ready: true })

    expect(timeline.events()).toEqual([
      { attributes: {}, markedAt: 10, name: 'app.entry' },
      {
        attributes: { ready: true },
        markedAt: 42,
        name: 'renderer.ready',
      },
    ])
  })
})
