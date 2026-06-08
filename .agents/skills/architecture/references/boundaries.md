## Dependency Boundaries

Use this doc when deciding whether an import, package dependency, or file move is valid.

### Allowed direction

```text
apps/*
  -> packages/*

db
  -> domain

config
  -> domain

git
  -> domain

runtime-tmux
  -> domain

scanner
  -> domain
  -> config
  -> git

reconciler
  -> domain
  -> db
  -> scanner

test-utils
  -> domain
  -> db
  -> config
```

### Forbidden edges

```text
domain -> anything
db -> scanner
db -> reconciler
scanner -> runtime-tmux
runtime-tmux -> db
git -> db
```

### Practical rules

- `domain` owns shared public contracts between packages.
- `domain` may use schema/validation libraries for those contracts.
- App-local components render and dispatch; they do not talk directly to adapters, db, scanner, or reconciler.
- `scanner` reads external state and emits normalized facts. It does not own tmux orchestration or durable belief.
- `reconciler` can consume scanner facts and persist Harbour belief. Do not push this logic back into UI or db.
- `db` stores Harbour state; it should not reach outward into scanner or reconciler logic.
- Map package-internal shapes to `domain` contracts at public boundaries instead of leaking internals outward.
- Keep app-specific command ids, key bindings, and view-model projections in the app unless truly shared.
- TUI keybindings should stay in `apps/tui`, close to the route, surface, or component that owns the behavior.
- Import public package exports, not internal implementation files from other packages.
- Prefer service-, program-, and layer-shaped public APIs at package boundaries.
- Keep repos, clients, and low-level wiring internal to the package unless deliberately documented as public.
- App entrypoints should compose public programs and layer factories instead of coupling to internal service wiring.

### Boundary review flow

When reviewing a change:

1. Identify the package that owns the edited file.
2. List every new imported package.
3. Compare the edge against allowed direction.
4. If invalid, move the logic to the nearest layer that can legally own it.
5. Prefer moving orchestration inward, not punching new holes in boundaries.

### Common fixes

- If app-local components need data from `db`, expose derived state through app/service wiring instead of importing `db` into UI.
- If app-local components need a Git or tmux action, dispatch a command and let app/service code call adapters.
- If `scanner` wants to mutate durable state, split read-side fact collection from reconciler write-side updates.
- If `db` needs domain interpretation, move that decision into `reconciler` or a domain-level helper.
- If a package has internal row/adapter shapes but exposes shared outputs, add a mapper/transform into `domain` contracts at the package boundary.
- If a package exposes a repo or client to another package, first ask whether a public service or program boundary is the better export.
