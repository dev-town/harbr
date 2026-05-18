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
- [x] `keymap`: Harbour browse keymap over `@opentui/keymap`
- [x] `ui`: minimal popover renderer for project/workspace/module lists
- [x] `apps/cli`: thin sync entrypoint
- [x] `apps/tui`: read-only popover with project -> workspace -> module drilldown

### Not Built Yet

- [ ] `events`: append-only event recording
- [ ] `observability`: logs/spans/diagnostics baseline
- [ ] TUI actions menu shell
- [ ] TUI direct open/attach behavior for project/workspace/module leaves
- [ ] write-side runtime/session creation flows
- [ ] write-side actions: create workspace, create/jump runtime, restore layout

## Next Up

### Target

Turn the read-only popover into a usable control surface by adding actions shell and real leaf behavior.

### Scope

- [x] discover tmux sessions
- [x] map session names to Harbour contexts
- [x] expose read-only runtime facts via service/program API
- [x] integrate runtime facts into scanner/reconciler/db after adapter exists
- [x] render projects/workspaces/modules in `apps/tui`
- [x] support scoped query filtering and active/all toggle
- [x] restore context from current tmux session first
- [x] persist fallback sticky db context for leaf selections

### Why

- current read model covers config, git, modules, and persistence
- current TUI browse flow works, but it still stops at read-only notices
- biggest missing product capability is turning a selected leaf into a real open/attach action
- next UX gap after that is contextual actions and worktree creation flows

## Suggested Order

1. [x] implement `runtime-tmux` read-only adapter
2. [x] extend domain for runtime facts/records
3. [x] extend scanner to observe tmux runtime state
4. [x] persist runtime state in `db`
5. [x] reconcile runtime state
6. [x] build read-only `apps/tui` nested selector
7. [ ] build TUI actions menu shell
8. [ ] replace read-only project/workspace/module notices with real open/attach behavior
9. [ ] add write-side worktree/session creation flows

## Notes

- [x] `docs/next-task-module-expansion.md` is complete now
- [x] keep tmux read-side first; defer write-heavy orchestration until browse flow works
- [x] TUI restore now prefers current tmux session context; db sticky context is fallback only
- [x] sticky context only persists committed leaf-like selections, not transient browse movement
- [ ] revisit `db` summary reads later: current project/workspace/module status summaries derive counts in JS after broad reads; replace with tighter Drizzle/SQL summary queries once TUI read shape settles
- [ ] default-workspace handling is partially in place: project -> modules skip works, but UI still renders the default workspace name when that layer is shown
- [ ] actions menu, runtime attach/open, and worktree creation still need explicit design/command-handler wiring in `apps/tui`
