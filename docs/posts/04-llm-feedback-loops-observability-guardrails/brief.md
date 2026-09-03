# Post 4 brief: Feedback loops for coding agents

## Working title

**Giving Coding Agents Better Feedback Loops with OpenTelemetry and Guardrails**

- Historical work window: from 29 June 2026
- Suggested length: 750–950 words
- Series role: first post that extracts a broader lesson from building Harbr
- Status: ready for an editorial draft

## Thesis

AI-assisted development works better when software can explain its behaviour in
structured, inspectable ways. Tests, types, lint rules, schema checks, migration
checks, and OpenTelemetry traces form a feedback loop: they turn “this looks
right” into evidence that a developer or coding agent can inspect and act on.

Harbr is the concrete example, not the whole subject. Effect made the
observability portion unusually easy to add because tracing could be composed as
a layer and spans could be attached to existing Effect programs without
inventing a separate diagnostics architecture.

## Core idea

Coding agents are strongest when they can run a loop like this:

```text
change -> execute -> observe -> compare -> refine
```

Each guardrail answers a different question:

- TypeScript: do the pieces still fit statically?
- Tests: does known behaviour remain true?
- Import boundaries: did the change preserve architectural ownership?
- Schema and migration checks: can configuration and persisted state still
  evolve safely?
- Formatting/linting: is the change mechanically consistent and free from known
  local hazards?
- Traces: what actually happened at runtime, in what order, and where was time
  spent?

The point is not to produce more dashboards. It is to make important behaviour
legible to both people and tools.

## Suggested narrative

1. Open with a coding agent making a plausible change but lacking evidence about
   runtime behaviour.
2. State the principle: modern software should expose its own feedback loop.
3. Use Harbr's single `bun run check` path as an example of deterministic
   pass/fail feedback.
4. Explain where pass/fail guardrails stop: they can say behaviour is valid, but
   not necessarily explain why startup feels slow.
5. Introduce OpenTelemetry as structured runtime evidence.
6. Explain the Effect advantage lightly: the OTLP exporter is a layer merged into
   the app, while `Effect.withSpan` follows service boundaries already present in
   the code.
7. Close with the broader lesson: agent-readiness is partly an observability and
   software-design property, not just a better prompt.

## Effect context

Effect belongs in two posts for different reasons:

- Post 2: service boundaries, layers, and app-edge composition.
- This post: those same boundaries made instrumentation composable.

Harbr's app builds its normal live layer, and profiling adds an OTLP layer only
when requested. Git, scanner, reconciler, DB, runtime, and sync operations use
named spans close to the operations they describe.

Keep this conceptual. A short excerpt from `makeObservabilityLayer` or one
`Effect.withSpan` call is enough.

## Important nuance

- OpenTelemetry does not automatically make an LLM understand the system. The
  agent still needs a tool or workflow that can retrieve and summarise the trace.
- More telemetry is not automatically better. Span names and attributes should
  reflect meaningful product operations.
- A green check is evidence against known failure modes, not proof of perfect
  software.
- Guardrails should encode actual architecture. Arbitrary rules create noise and
  teach agents to work around the tooling.
- Harbr's profiling was opt-in and local; it was not a SaaS telemetry pipeline.

## Historically accurate examples

- On 29 June, local profiling was added behind `--profile` with OTLP export and a
  local Jaeger workflow.
- Spans covered config, DB, reconciliation, scanning, Git, and tmux/runtime work.
- The root check combined linting, tests, typechecking, schema checks, migration
  checks, and formatting. Later it also accumulated installer and plugin checks.
- ESLint dependency rules guarded package direction; this was more valuable than
  style linting alone.

## Avoid

- Do not claim OpenTelemetry was built specifically for LLMs.
- Do not claim the agent consumed traces automatically.
- Do not imply telemetry replaces tests, types, logs, or human judgement.
- Do not turn the article into an OTLP or Jaeger installation tutorial.
- Do not claim every application needs Effect to gain these benefits.

## Local evidence

- Original profiling task:
  `/Users/andy/.codex/sessions/2026/06/29/rollout-2026-06-29T20-41-27-019f14e6-a218-7ac2-b774-a3d592e8f7a2.jsonl`
- Initial profiling commit: `fe6fccce4` (`Add local OTEL profiling`)
- Combined profiling/parallel-scan merge commit: `febc2c98f`
- OTLP layer:
  `/Users/andy/Sites/harbour/main/apps/tui/src/observability/layer.ts`
- App layer composition:
  `/Users/andy/Sites/harbour/main/apps/tui/src/services/layer.ts`
- Representative spans:
  `/Users/andy/Sites/harbour/main/packages/git/src/services/git.live.ts`
  `/Users/andy/Sites/harbour/main/packages/scanner/src/scanner.observe.ts`
  `/Users/andy/Sites/harbour/main/packages/reconciler/src/services/reconciler.live.ts`
- Root feedback-loop command:
  `/Users/andy/Sites/harbour/main/package.json`
- Dependency guardrails:
  `/Users/andy/Sites/harbour/main/packages/config-eslint/base.mjs`
- Local profiler lifecycle:
  `/Users/andy/Sites/harbour/main/apps/tui/src/commands/profile.ts`

## Suggested visual

A small feedback-loop diagram is preferable to a dashboard screenshot:

```text
agent change
    -> types/tests/boundaries
    -> run application
    -> traces and structured output
    -> evidence-informed next change
```

Post 5 contains the concrete startup trace story and historical visual notes.
