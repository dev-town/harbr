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

- `domain` defines shared Harbour contracts and language for cross-package boundaries.
- `config` expresses user or project intent.
- `git` and `runtime-tmux` adapt external systems.
- `scanner` observes reality and emits facts only.
- `reconciler` owns belief, state transitions, and durable updates.
- `db` stores Harbour metadata, cache, history, and event-adjacent state. It is not source of truth for Git or tmux.
- `events` records why things changed.
- `observability` captures logs, spans, and diagnostics.
- `ui` renders state and dispatches actions. Keep shell logic out.
- `apps/tui` wires runtime, subscriptions, command handlers, OpenTUI keybindings, and render tree.

## Schema-first contracts

- Put shared public package inputs/outputs in `domain`.
- Prefer Zod schemas as source of truth for those contracts when validation matters.
- Export inferred types from schemas for shared boundary shapes.
- Do not put DB rows, adapter internals, or app-local view models in `domain`.
- Keep raw config-file schema in `config`; map normalized outputs to `domain` contracts.
- Keep DB rows local to `db`; map public outputs to `domain` contracts at the package boundary.

## App-local projections

- App command ids, key bindings, navigation unions, and render rows stay app-local unless shared across apps.
- TUI keybindings live with the surface that owns the behavior: root bindings at app root, route bindings in route hooks, modal bindings in component-local hooks.
- Prefer `@opentui/keymap/react` `useBindings` directly. Add wrappers only after repeated patterns prove they improve clarity.
- Use target-scoped keymap layers for focus-owned surfaces. Use open-state, high-priority layers for modal overlays that must capture keys regardless of focus.
- TUI row/view-model types are derived projections from domain contracts, not domain contracts themselves.
- Avoid app-local catch-all files; split commands, navigation, and row types by concern.

## Public vs internal code

- Prefer public package boundaries that expose services, programs, and layer factories.
- Treat repos, clients, low-level helpers, and implementation wiring as internal unless a package deliberately documents them as public.
- Other packages should import from a package's public exports, not reach into its internal folders.
- Inside a package, prefer this shape when the code needs it:

```text
public programs/services
-> services
-> repos
-> clients/adapters/resources
```

- Not every package needs every layer. Use the shallowest correct shape.

## Effect and file conventions

- For detailed Effect API and idiom questions, use the `effect-reference` skill.
- `index.ts` should be export-only.
- Put service contracts in `services/*.service.ts`.
- Put live layers and implementation wiring in `services/*.live.ts`.
- Put persistence internals in `repos/*.repo.ts`.
- Use `*.errors.ts` and `*.types.ts` for package-scoped contracts.
- Use `*Client` for low-level resource/access boundaries when `*Service` would imply a broader capability.
- Keep pure support files focused and package-scoped when helpful, for example `config.path.ts`, `git.worktree.ts`, or `reconciler.operations.ts`.

## App boundary conventions

- App entrypoints should prefer exported programs or small collections of programs for user-facing functionality.
- App entrypoints should compose public layer factories from packages.
- Do not couple apps to internal package wiring when a program export already exists.
- Keep runtime boot choices flexible. The architecture cares about clean boundaries, not one required runtime helper or one required terminal pattern.

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

1. Is this a shared public input/output contract between packages? Put it in `domain`.
2. Is this user/project configuration? Put it in `config`.
3. Is this raw Git or tmux interaction? Put it in an adapter package, not UI.
4. Is this observation and normalization of external reality? Put it in `scanner`.
5. Is this deciding what Harbour should believe and persist? Put it in `reconciler`.
6. Is this durable schema, persistence service, internal repo, or database client code? Put it in `db`.
7. Is this rendering, view-state projection, or interaction wiring? Put it in `ui` or `apps/tui`.

After that, ask:

1. Is this shape only used inside one package? Keep it local.
2. Is this a DB row or adapter detail? Keep it local and map at the boundary.
3. Is this a TUI-only projection or command map? Keep it in the app.

Prefer one clear owner. Avoid splitting a single rule between scanner, reconciler, and UI unless the architecture truly demands it.

## Review checklist

Before finalizing, check:

1. Right package owner?
2. Dependency direction valid?
3. Shared boundary contracts in `domain`, with package-local internals kept local?
4. Scanner still fact-only?
5. Reconciler still owns belief and state transitions?
6. UI free of raw Git, tmux, SQL, and reconciliation logic?
7. Durable state separated from external source-of-truth state?
8. DB/config/adapter internals mapped to domain contracts at boundaries rather than leaked outward?
9. Change still supports a calm, sparse, reliable product?

## Output style

When answering architecture questions or reviewing a design:

1. State the recommended package or boundary decision first.
2. Give the reason in Harbour terms.
3. Call out any forbidden edge or leak plainly.
4. If useful, propose the smallest valid package split or vertical slice.
