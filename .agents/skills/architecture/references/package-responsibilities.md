## Package Responsibilities

Use this doc to decide where new code belongs.

### `domain`

- Owns shared Harbour contracts and language at package boundaries.
- Good homes: shared public inputs/outputs, observations, summaries, sync results, UI context shared across packages.
- Prefer schema-first contracts here when validation matters; export inferred TS types from schemas.
- Do not put IO, persistence, UI-only projections, DB rows, or adapter internals here.

### `config`

- Owns config shape, loading, validation, defaults, and schema-facing intent.
- Use for user/project intent, not observed reality.
- Raw config-file schema stays here.
- Normalize config outputs so they match `domain` contracts where those outputs cross package boundaries.
- Public config APIs should expose service tags, API types, option tags, and live layers. Keep low-level parsing helpers internal.

### `git`

- Owns raw Git integration.
- Use for repo detection, worktree listing, branch/head state, dirty state, and Git-side mutations.
- Do not put Harbour reconciliation or db writes here.
- Prefer exported service tags, API types, and live layers at the package boundary. Keep raw command details internal.

### `runtime-tmux`

- Owns raw tmux integration and runtime mapping.
- Use for session discovery, naming, and runtime lifecycle operations.
- Do not let it persist state directly.

### `scanner`

- Owns read-side observation and normalization.
- Converts config, Git, and tmux reality into facts.
- Facts stay read-only and mutation-free.
- Expose scanner capabilities as services and live layers. Keep scanning helpers internal.

### `reconciler`

- Owns core product logic.
- Consumes validated `ProjectConfig` intent supplied by app edges.
- Does not load config files or depend on `@harbr/config`.
- Decides what changed, what Harbour should believe, and what to persist.
- This is the right home for durable state transitions.
- Export reconciler services and live layers for app entrypoints.

### `db`

- Owns Drizzle schema, migrations, exported persistence services, internal repos, and SQLite access.
- Stores Harbour metadata, cache, and history.
- It does not become source of truth for Git or tmux reality.
- DB row/table types stay local to `db`.
- Map internal rows into `domain` contracts at the public package boundary.
- Outside `db`, consume public services, not internal repos or low-level clients.
- Inside `db`, prefer service -> repo -> client layering when the complexity warrants it.

### app-local components

- Own presentational components and view-state display concerns when no shared package is warranted.
- Render Harbour state. Keep raw shell, db, and reconciliation logic out.
- Consume app-provided state and commands, not internal package wiring.
- App-local view models and row projections belong here or in app-local `types/` files, not in `domain`.
- Component-specific keybindings belong beside the component, usually in local `hooks/` when the component would otherwise become verbose.

### `apps/tui`

The interactive OpenTUI application.

Owns:

- app bootstrap
- OpenTUI render tree
- Zustand store setup
- OpenTUI keymap creation
- root, route, surface, and modal keyboard input routing
- command palette
- app-specific command ids and key bindings, when command ids are still useful
- screen layout
- subscriptions to Harbour state
- execution of command handlers
- loading and validating config before invoking reconciliation
- starting and stopping the app Effect runtime
- composing public package live layers and option layers into the app layer
- TUI-only navigation unions and row/view-model projections

Depends on:

```text
@harbr/domain
@harbr/db
@harbr/config
@harbr/scanner
@harbr/reconciler
@harbr/runtime-tmux
```

Must not contain:

- Drizzle schema
- raw SQL
- raw git command logic
- raw tmux command logic
- reconciliation logic
- DB row/table shapes shared as app contracts

### `apps/tui`

- Owns the single `harbour` app entrypoint.
- Good homes: TUI launch wiring plus thin headless commands such as `sync`, `doctor`, and list/read commands.
- Prefer exported services and live layers from packages.
- Keep app commands thin: parse args, create the app runtime, request services, render output, and dispose runtime.

## Shared organization conventions

- Public package APIs should usually expose service tags, API types, and live layers.
- Package-level helper programs should not hide live layer provisioning.
- Use option services for runtime configuration that participates in app composition.
- `make*` functions are appropriate for app lifecycle constructors, not no-op wrappers around package live layers.
- Shared cross-package inputs/outputs should usually live in `domain`.
- Internal implementation details should stay internal to the package.
- Split app-local types by concern; avoid catch-all files that mix bindings, navigation, and projections.
- Keep TUI keybindings app-local. Root quit can be global; route bindings should live in route-local hooks; modal bindings should live in modal-local hooks.
- Prefer direct `@opentui/keymap/react` `useBindings` over package wrappers. Use target-scoped layers for focus-owned surfaces and open-state high-priority layers for modal overlays.
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
