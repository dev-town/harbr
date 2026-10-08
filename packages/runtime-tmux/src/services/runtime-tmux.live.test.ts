import { RuntimeService } from '@harbr/runtime'
import { Effect, Option, Tracer } from 'effect'
import { describe, expect, it, vi } from 'vitest'

const commands = vi.hoisted(() => [] as string[][])

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>()
  const execFile = () => undefined

  Object.defineProperty(execFile, Symbol.for('nodejs.util.promisify.custom'), {
    value: async (_command: string, args: string[]) => {
      commands.push(args)
      return {
        stdout: args[0] === 'display-message' ? '/dev/pts/1\n' : '',
        stderr: '',
      }
    },
  })

  return { ...actual, execFile }
})

import { RuntimeServiceLive } from './runtime-tmux.live'

describe('tmux runtime discovery', () => {
  it('keeps discovery spans under their calling operations', async () => {
    commands.length = 0
    const spans: Tracer.NativeSpan[] = []
    const tracer = Tracer.make({
      span(options) {
        const span = new Tracer.NativeSpan(options)
        spans.push(span)
        return span
      },
    })
    const target = {
      cwd: '/tmp',
      moduleName: null,
      projectName: 'alpha',
      workspaceName: null,
    }

    await Effect.runPromise(
      Effect.gen(function* () {
        const runtime = yield* RuntimeService
        yield* runtime.openOrCreateRuntime(target)
        yield* runtime.createRuntimeWindows({ target, windows: [] })
      }).pipe(
        Effect.withSpan('caller'),
        Effect.withTracer(tracer),
        Effect.provide(RuntimeServiceLive),
      ),
    )

    const caller = spans.find((span) => span.name === 'caller')
    const open = spans.find((span) => span.name === 'runtime.tmux.openOrCreateRuntime')
    const create = spans.find((span) => span.name === 'runtime.tmux.createRuntimeWindows')
    const discoveries = spans.filter((span) => span.name === 'runtime.tmux.listRuntimes')

    expect(Option.getOrUndefined(open?.parent ?? Option.none())).toBe(caller)
    expect(Option.getOrUndefined(create?.parent ?? Option.none())).toBe(caller)
    expect(discoveries).toHaveLength(2)
    expect(Option.getOrUndefined(discoveries[0]?.parent ?? Option.none())).toBe(open)
    expect(Option.getOrUndefined(discoveries[1]?.parent ?? Option.none())).toBe(create)
    expect(commands.filter(([command]) => command === 'list-sessions')).toHaveLength(2)
  })
})
