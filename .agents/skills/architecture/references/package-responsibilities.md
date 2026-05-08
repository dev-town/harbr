## Package Responsibilities

Use this doc to decide where new code belongs.

### `domain`

- Owns Harbour language: entities, ids, states, commands, and fact shapes.
- Should be stable, dependency-free, and broadly reusable.
- Do not put IO, persistence, UI, or adapter code here.

### `config`

- Owns config shape, loading, validation, defaults, and schema-facing intent.
- Use for user/project intent, not observed reality.

### `git`

- Owns raw Git integration.
- Use for repo detection, worktree listing, branch/head state, dirty state, and Git-side mutations.
- Do not put Harbour reconciliation or db writes here.

### `runtime-tmux`

- Owns raw tmux integration and runtime mapping.
- Use for session discovery, naming, and runtime lifecycle operations.
- Do not let it persist state directly.

### `scanner`

- Owns read-side observation and normalization.
- Converts config, Git, and tmux reality into facts.
- Facts stay read-only and mutation-free.

### `reconciler`

- Owns core product logic.
- Decides what changed, what Harbour should believe, what to persist, and which events to emit.
- This is the right home for durable state transitions.

### `db`

- Owns Drizzle schema, migrations, repositories, and SQLite persistence.
- Stores Harbour metadata, cache, history, and event-related state.
- It does not become source of truth for Git or tmux reality.

### `events`

- Owns append-only event recording and event-shape persistence.
- Use for why things changed, not for primary business logic.

### `observability`

- Owns logs, spans, diagnostic helpers, and internal visibility.
- Keep it cross-cutting and low-friction.

### `keymap`

- Owns keybinding contexts and command routing.
- Translate input into command ids. Do not embed deep product logic here.

### `ui`

- Owns presentational components and view-state display concerns.
- Render Harbour state. Keep raw shell, db, and reconciliation logic out.

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
@harbour/ui
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

### `test-utils`

- Owns shared fixtures and test helpers.
- Keep it supportive, not a backdoor that bypasses package boundaries.
