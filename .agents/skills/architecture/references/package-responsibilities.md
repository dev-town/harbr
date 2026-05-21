## Package Responsibilities

Use this doc to decide where new code belongs.

### `domain`

- Owns Harbour language: entities, ids, states, commands, and fact shapes.
- Should be stable, dependency-free, and broadly reusable.
- Do not put IO, persistence, UI, or adapter code here.

### `config`

- Owns config shape, loading, validation, defaults, and schema-facing intent.
- Use for user/project intent, not observed reality.
- Public config APIs should be service- or program-shaped. Keep low-level parsing helpers internal.

### `git`

- Owns raw Git integration.
- Use for repo detection, worktree listing, branch/head state, dirty state, and Git-side mutations.
- Do not put Harbour reconciliation or db writes here.
- Prefer exported services/programs at the package boundary. Keep raw command details internal.

### `runtime-tmux`

- Owns raw tmux integration and runtime mapping.
- Use for session discovery, naming, and runtime lifecycle operations.
- Do not let it persist state directly.

### `scanner`

- Owns read-side observation and normalization.
- Converts config, Git, and tmux reality into facts.
- Facts stay read-only and mutation-free.
- Expose scanner capabilities as services/programs. Keep scanning helpers internal.

### `reconciler`

- Owns core product logic.
- Decides what changed, what Harbour should believe, what to persist, and which events to emit.
- This is the right home for durable state transitions.
- Export reconciler programs and layer factories for app entrypoints.

### `db`

- Owns Drizzle schema, migrations, exported persistence services, internal repos, and SQLite access.
- Stores Harbour metadata, cache, history, and event-related state.
- It does not become source of truth for Git or tmux reality.
- Outside `db`, consume public services, not internal repos or low-level clients.
- Inside `db`, prefer service -> repo -> client layering when the complexity warrants it.

### `events`

- Owns append-only event recording and event-shape persistence.
- Use for why things changed, not for primary business logic.

### `observability`

- Owns logs, spans, diagnostic helpers, and internal visibility.
- Keep it cross-cutting and low-friction.

### `keymap`

- Owns keybinding contexts and command routing.
- Translate input into command ids. Do not embed deep product logic here.

### app-local components

- Own presentational components and view-state display concerns when no shared package is warranted.
- Render Harbour state. Keep raw shell, db, and reconciliation logic out.
- Consume app-provided state and commands, not internal package wiring.

### `apps/tui`

The interactive OpenTUI application.

Owns:

- app bootstrap
- OpenTUI render tree
- Jotai store setup
- keyboard input routing
- command palette
- screen layout
- subscriptions to Harbour state
- execution of command handlers
- starting and stopping Effect runtime fibers
- composing public programs and layer factories from packages

Depends on:

```text
@harbour/domain
@harbour/db
@harbour/config
@harbour/scanner
@harbour/reconciler
@harbour/runtime-tmux
@harbour/events
@harbour/observability
@harbour/keymap
```

Must not contain:

- Drizzle schema
- raw SQL
- raw git command logic
- raw tmux command logic
- reconciliation logic

### `apps/cli`

- Owns CLI entrypoints once core services exist.
- Good homes: `scan`, `doctor`, and list/read commands.
- Prefer exported programs and layer factories from packages.
- Keep CLI thin: parse args, choose program, provide layers, render output.

## Shared organization conventions

- Public package APIs should usually expose services, programs, and layer factories.
- Internal implementation details should stay internal to the package.
- When packages grow, prefer:

```text
services/*.service.ts
services/*.live.ts
repos/*.repo.ts
*.errors.ts
*.types.ts
```

- Use `*Client` for low-level resource/access boundaries when `*Service` would overstate the abstraction.

### `test-utils`

- Owns shared fixtures and test helpers.
- Keep it supportive, not a backdoor that bypasses package boundaries.
