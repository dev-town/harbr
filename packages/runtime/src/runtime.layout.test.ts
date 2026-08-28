import {
  runtimeLayoutTargetFixture,
  runtimeLayoutWindowsFixture,
} from '@harbr/test-utils'
import { describe, expect, it } from 'vitest'

import {
  normalizeRuntimePaneCommands,
  resolveRuntimePaneCwd,
} from './runtime.layout'

describe('runtime layout semantics', () => {
  it('normalizes shared pane CWDs and startup commands for every adapter', () => {
    const [editor, logs] = runtimeLayoutWindowsFixture
    const [code, tests] = editor?.panes ?? []
    const [serverLogs] = logs?.panes ?? []

    expect(
      resolveRuntimePaneCwd(runtimeLayoutTargetFixture.cwd, code?.cwd),
    ).toBe('/work/alpha-feature')
    expect(
      resolveRuntimePaneCwd(runtimeLayoutTargetFixture.cwd, tests?.cwd),
    ).toBe('/work/alpha-feature/apps/cli')
    expect(
      resolveRuntimePaneCwd(runtimeLayoutTargetFixture.cwd, serverLogs?.cwd),
    ).toBe('/var/log/alpha')
    expect(normalizeRuntimePaneCommands(code?.command)).toEqual(['nvim .'])
    expect(normalizeRuntimePaneCommands(tests?.command)).toEqual([
      'bun run test',
      'bun run lint',
    ])
  })
})
