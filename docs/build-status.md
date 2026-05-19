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
- [x] `apps/tui`: popover with project -> workspace -> module drilldown and leaf open/attach behavior

### Not Built Yet

- [ ] `events`: append-only event recording
- [ ] `observability`: logs/spans/diagnostics baseline
- [ ] TUI actions menu shell
- [x] TUI direct open/attach behavior for project/workspace/module leaves
- [x] write-side runtime/session creation flows
- [ ] write-side actions: create workspace, create/jump runtime, restore layout

## Next Up

### Target

Turn the browse popover into a fuller control surface by adding actions shell and workspace/worktree creation flows.

### Scope

- [x] discover tmux sessions
- [x] map session names to Harbour contexts
- [x] expose read-only runtime facts via service/program API
- [x] integrate runtime facts into scanner/reconciler/db after adapter exists
- [x] render projects/workspaces/modules in `apps/tui`
- [x] support scoped query filtering and active/all toggle
- [x] restore context from current tmux session first
- [x] persist fallback sticky db context for leaf selections
- [x] open/attach project, workspace, and module leaves from `apps/tui`
- [x] derive canonical tmux session names from project/workspace/module context
- [x] create missing tmux sessions on leaf open and switch the active client

### Why

- current browse/open flow now covers config, git, modules, persistence, and tmux resume/create
- biggest remaining UX gap is contextual actions and worktree creation flows
- next product step is moving beyond default open/attach into explicit project/workspace/module actions

## Suggested Order

1. [x] implement `runtime-tmux` read-only adapter
2. [x] extend domain for runtime facts/records
3. [x] extend scanner to observe tmux runtime state
4. [x] persist runtime state in `db`
5. [x] reconcile runtime state
6. [x] build read-only `apps/tui` nested selector
7. [ ] build TUI actions menu shell
8. [x] replace read-only project/workspace/module notices with real open/attach behavior
9. [ ] add write-side worktree/session creation flows beyond default open/create

## Notes

- [x] `docs/next-task-module-expansion.md` is complete now
- [x] keep tmux read-side first; defer write-heavy orchestration until browse flow works
- [x] TUI restore now prefers current tmux session context; db sticky context is fallback only
- [x] sticky context only persists committed leaf-like selections, not transient browse movement
- [x] TUI leaf open now derives canonical tmux session names from semantic context; it does not depend on db-stored session-name identity
- [x] canonical tmux session naming now uses `~~` between project/workspace/module segments and escapes only tmux-dangerous characters inside each segment
- [x] default workspace breadcrumb/back behavior now respects implicit workspace skipping in module mode
- [ ] revisit `db` summary reads later: current project/workspace/module status summaries derive counts in JS after broad reads; replace with tighter Drizzle/SQL summary queries once TUI read shape settles
- [x] default-workspace handling now skips the workspace breadcrumb/back hop when module mode came through the implicit default workspace
- [ ] actions menu and worktree creation still need explicit design/command-handler wiring in `apps/tui`
