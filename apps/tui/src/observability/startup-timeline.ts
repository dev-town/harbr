export type StartupTiming = {
  processStartedAt: number
  processStartedAtUnixNanos: bigint
  tuiModuleLoadedAt: number
}

export type StartupEventAttributes = Record<string, boolean | number | string>

export type StartupEvent = {
  attributes: StartupEventAttributes
  markedAt: number
  name: string
}

export type StartupTimeline = {
  events(): readonly StartupEvent[]
  mark(name: string, attributes?: StartupEventAttributes, markedAt?: number): void
  timing: StartupTiming
}

export function createStartupTimeline(timing: StartupTiming): StartupTimeline {
  const startupEvents: StartupEvent[] = []

  return {
    events: () => startupEvents,
    mark: (name, attributes = {}, markedAt = performance.now()) => {
      startupEvents.push({ attributes, markedAt, name })
    },
    timing,
  }
}
