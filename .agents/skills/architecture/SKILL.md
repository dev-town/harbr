---
name: architecture
description: Use this skill whenever the user asks where code should live in Harbour, how a feature should fit the repo, whether a dependency edge is allowed, how to slice work across packages, or how to keep UI, scanner, reconciler, db, git, and tmux responsibilities clean. Also use it for architecture reviews, package design, import-boundary questions, feature planning, and refactors that might leak logic across layers, even if the user does not say architecture explicitly.
---

# Harbour Architecture

Use this skill to keep changes aligned with Harbour's repo shape, dependency direction, and controller/reconciler model.

## Start here

1. Restate the requested change in Harbour terms: `Project -> Workspace -> Module -> Runtime`.
2. Decide whether the work changes persistent domain model, external observation, durable Harbour state, or UI behavior.
3. Place code in the shallowest correct package. Do not spread logic across layers without need.
4. Check dependency direction before proposing imports or file moves.
5. If the task touches a specific concern, read the matching reference doc before editing.

## Core model

Harbour is a control layer for development contexts.

Persistent domain model:

```text
Project -> Workspace -> Module
```

Optional execution state:

```text
Runtime / tmux session
```

Git and tmux stay external sources of truth. Harbour observes, reconciles, and coordinates them.

Read path:

```text
observed external state
-> scanners
-> facts/events
-> reconciler
-> SQLite/Drizzle state
-> TUI view state
```

Write path:

```text
key press
-> command id
-> command handler
-> domain action
-> git/tmux/runtime adapter
-> external state changes
-> scanners observe again
```

## Package rules

- `domain` defines Harbour language and depends on nothing.
- `config` expresses user or project intent.
- `git` and `runtime-tmux` adapt external systems.
- `scanner` observes reality and emits facts only.
- `reconciler` owns belief, state transitions, and durable updates.
- `db` stores Harbour metadata, cache, history, and event-adjacent state. It is not source of truth for Git or tmux.
- `events` records why things changed.
- `observability` captures logs, spans, and diagnostics.
- `keymap` maps input to commands.
- `ui` renders state and dispatches actions. Keep shell logic out.
- `apps/tui` wires runtime, subscriptions, command handlers, and render tree.

## Reference docs

Read only what the task needs.

- `references/boundaries.md`
  Use for allowed imports, forbidden edges, lint-boundary failures, and file placement checks.

- `references/package-responsibilities.md`
  Use for deciding which package owns new code or whether logic belongs in `apps/tui` vs a package.

- `references/build-order.md`
  Use for planning vertical slices, sequencing new subsystems, and avoiding premature work.

- `references/mental-model.md`
  Use for fast repo orientation, reviews, and deciding what each layer means.

## Decision heuristics

When choosing placement, prefer these questions in order:

1. Is this Harbour language? Put it in `domain`.
2. Is this user/project configuration? Put it in `config`.
3. Is this raw Git or tmux interaction? Put it in an adapter package, not UI.
4. Is this observation and normalization of external reality? Put it in `scanner`.
5. Is this deciding what Harbour should believe and persist? Put it in `reconciler`.
6. Is this durable schema or repository code? Put it in `db`.
7. Is this rendering, view-state projection, or interaction wiring? Put it in `ui`, `keymap`, or `apps/tui`.

Prefer one clear owner. Avoid splitting a single rule between scanner, reconciler, and UI unless the architecture truly demands it.

## Review checklist

Before finalizing, check:

1. Right package owner?
2. Dependency direction valid?
3. Scanner still fact-only?
4. Reconciler still owns belief and state transitions?
5. UI free of raw Git, tmux, SQL, and reconciliation logic?
6. Durable state separated from external source-of-truth state?
7. Change still supports a calm, sparse, reliable product?

## Output style

When answering architecture questions or reviewing a design:

1. State the recommended package or boundary decision first.
2. Give the reason in Harbour terms.
3. Call out any forbidden edge or leak plainly.
4. If useful, propose the smallest valid package split or vertical slice.
