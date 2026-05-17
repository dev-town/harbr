# Harbour Build Status

## Current Status

### Built

- [x] `domain`: core config and scan/result types
- [x] `config`: config loading, validation, normalization
- [x] `git`: repo inspection and workspace path resolution
- [x] `scanner`: workspace-aware module expansion and project observation
- [x] `db`: SQLite schema, migrations, project snapshot persistence
- [x] `reconciler`: config -> scanner -> db sync flow
- [x] `runtime-tmux`: read-only tmux session discovery and Harbour context parsing
- [x] `apps/cli`: thin sync entrypoint

### Not Built Yet

- [ ] read-only nested TUI
- [ ] `keymap`: command routing
- [ ] `ui`: presentational components
- [ ] `events`: append-only event recording
- [ ] `observability`: logs/spans/diagnostics baseline
- [ ] write-side actions: create workspace, create/jump runtime, restore layout

## Next Up

### Target

Build the first read-only TUI next.

### Scope

- [x] discover tmux sessions
- [x] map session names to Harbour contexts
- [x] expose read-only runtime facts via service/program API
- [x] integrate runtime facts into scanner/reconciler/db after adapter exists

### Why

- current read model covers config, git, modules, and persistence
- biggest missing product capability is runtime awareness
- first useful TUI depends on runtime facts plus current project/workspace/module facts

## Suggested Order

1. [x] implement `runtime-tmux` read-only adapter
2. [x] extend domain for runtime facts/records
3. [x] extend scanner to observe tmux runtime state
4. [x] persist runtime state in `db`
5. [x] reconcile runtime state
6. [ ] build read-only `apps/tui` nested selector

## Notes

- [x] `docs/next-task-module-expansion.md` is complete now
- [x] keep tmux read-side first; defer write-heavy orchestration until browse flow works
- [ ] revisit `db` summary reads later: current project/workspace/module status summaries derive counts in JS after broad reads; replace with tighter Drizzle/SQL summary queries once TUI read shape settles
