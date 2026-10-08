import { CliRenderEvents, type CliRenderer } from '@opentui/core'
import { Context, Effect, Exit, Option } from 'effect'

import type { TuiEffectRuntime } from '~/services/effect-runtime'
import type { TuiProfileOptions } from '~/types'
import type { StartupEventAttributes, StartupTimeline } from './startup-timeline'

export type StartupTelemetry = {
  completeOnNextFrame(attributes: StartupEventAttributes): void
  finish(name: string, attributes?: StartupEventAttributes): void
  mark(name: string, attributes?: StartupEventAttributes, markedAt?: number): void
  markOnNextFrame(name: string, attributes?: StartupEventAttributes): void
  withParent<A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R>
}

type MakeStartupTelemetryOptions = {
  effectRuntime: TuiEffectRuntime
  profile: TuiProfileOptions | undefined
  renderer: CliRenderer
  timeline: StartupTimeline
}

const noOpStartupTelemetry: StartupTelemetry = {
  completeOnNextFrame: () => undefined,
  finish: () => undefined,
  mark: () => undefined,
  markOnNextFrame: () => undefined,
  withParent: (effect) => effect,
}

export async function makeStartupTelemetry({
  effectRuntime,
  profile,
  renderer,
  timeline,
}: MakeStartupTelemetryOptions): Promise<StartupTelemetry> {
  if (!profile) {
    return noOpStartupTelemetry
  }

  const span = await effectRuntime.runPromise(
    Effect.gen(function* () {
      const tracer = yield* Effect.tracer

      return tracer.span({
        name: 'harbr.startup',
        parent: Option.none(),
        annotations: Context.empty(),
        links: [],
        startTime: timeline.timing.processStartedAtUnixNanos,
        kind: 'internal',
        root: true,
        sampled: true,
      })
    }),
  )
  span.attribute('harbr.profile.session_id', profile.sessionId)

  let isComplete = false
  let shouldCompleteOnFrame = false
  let completionAttributes: StartupEventAttributes = {}
  const pendingFrameEvents: Array<{
    attributes: StartupEventAttributes
    name: string
  }> = []

  const timestampAt = (markedAt: number) =>
    timeline.timing.processStartedAtUnixNanos +
    BigInt(Math.round((markedAt - timeline.timing.processStartedAt) * 1_000_000))

  const mark: StartupTelemetry['mark'] = (name, attributes = {}, markedAt = performance.now()) => {
    if (isComplete) {
      return
    }

    span.event(name, timestampAt(markedAt), {
      ...attributes,
      'harbr.startup.elapsed_ms': Number((markedAt - timeline.timing.processStartedAt).toFixed(3)),
    })
  }

  const complete = (markedAt: number) => {
    if (isComplete) {
      return
    }

    isComplete = true
    renderer.off(CliRenderEvents.FRAME, onFrame)
    span.end(timestampAt(markedAt), Exit.succeed(undefined))
  }

  const onFrame = (event: { frameId: number }) => {
    const markedAt = performance.now()

    for (const pendingEvent of pendingFrameEvents.splice(0)) {
      mark(
        pendingEvent.name,
        { ...pendingEvent.attributes, 'ui.frame_id': event.frameId },
        markedAt,
      )
    }

    if (shouldCompleteOnFrame) {
      mark(
        'ui.results_painted',
        { ...completionAttributes, 'ui.frame_id': event.frameId },
        markedAt,
      )
      complete(markedAt)
    }
  }

  renderer.on(CliRenderEvents.FRAME, onFrame)

  for (const event of timeline.events()) {
    mark(event.name, event.attributes, event.markedAt)
  }

  return {
    completeOnNextFrame: (attributes) => {
      if (isComplete || shouldCompleteOnFrame) {
        return
      }

      completionAttributes = attributes
      shouldCompleteOnFrame = true
    },
    finish: (name, attributes = {}) => {
      const markedAt = performance.now()
      mark(name, attributes, markedAt)
      complete(markedAt)
    },
    mark,
    markOnNextFrame: (name, attributes = {}) => {
      if (isComplete) {
        return
      }

      pendingFrameEvents.push({ attributes, name })
    },
    withParent: (effect) => (isComplete ? effect : effect.pipe(Effect.withParentSpan(span))),
  }
}
