# Harbr Build Status

## Current Status

### Built

- [x] `domain`: core config and scan/result types
- [x] `config`: config loading, validation, normalization
- [x] `git`: repo inspection and workspace path resolution
- [x] `scanner`: workspace-aware module expansion and project observation
- [x] `db`: SQLite schema, migrations, project snapshot persistence
- [x] `reconciler`: config -> scanner -> db sync flow
- [x] `runtime-tmux`: read-only tmux session discovery and Harbr context parsing
- [x] `keymap`: Harbr browse keymap over `@opentui/keymap`
- [x] `ui`: minimal popover renderer for project/workspace/module lists
- [x] `apps/tui`: popover plus headless sync command with project -> workspace -> module drilldown and leaf open/attach behavior
- [x] config-defined reusable named window/pane recipes
- [x] TUI create-windows picker shell for project/workspace/module contexts in Browse and Active tabs

### Not Built Yet

- [x] TUI actions menu shell
- [x] TUI direct open/attach behavior for project/workspace/module leaves
- [x] write-side runtime/session creation flows
- [x] write-side actions: create workspace/worktree, configured tmux windows/panes, advanced create/jump runtime, restore layout

## Next Up

### Target

Keep the browse popover as the control surface for project, workspace, module, runtime, and configured layout actions.

### Scope

- [x] discover tmux sessions
- [x] map session names to Harbr contexts
- [x] expose read-only runtime facts via service/program API
- [x] integrate runtime facts into scanner/reconciler/db after adapter exists
- [x] render projects/workspaces/modules in `apps/tui`
- [x] support scoped query filtering and active/all toggle
- [x] restore context from current tmux session first
- [x] persist fallback sticky db context for leaf selections
- [x] open/attach project, workspace, and module leaves from `apps/tui`
- [x] derive canonical tmux session names from project/workspace/module context
- [x] create missing tmux sessions on leaf open and switch the active client
- [x] add contextual actions modal for project/workspace/module secondary actions
- [x] add second-step multi-select window picker for configured windows
- [x] route TUI commands through active surface + global layer semantics

### Why

- current browse/open flow now covers config, git, modules, persistence, workspace/worktree creation, tmux resume/create, and configured layout loading
- contextual project/workspace/module actions are wired through the TUI action surface
- remaining UX polish includes hiding already-existing configured windows from the picker

## Suggested Order

1. [x] implement `runtime-tmux` read-only adapter
2. [x] extend domain for runtime facts/records
3. [x] extend scanner to observe tmux runtime state
4. [x] persist runtime state in `db`
5. [x] reconcile runtime state
6. [x] build read-only `apps/tui` nested selector
7. [x] build TUI actions menu shell
8. [x] replace read-only project/workspace/module notices with real open/attach behavior
9. [x] add write-side worktree/session/window creation flows beyond default open/create

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
- [x] actions menu now renders as a compact modal with project/workspace/module open actions
- [x] current built actions are:
  - project: open/start project, create project windows
  - workspace: open/start workspace, create workspace windows, new workspace form, open/start project root, create project windows
  - module: open/start module, create module windows, open/start workspace root, create workspace windows, open/start project root, create project windows
- [x] runtime action labels use `Open` when the exact runtime session exists and `Start` when it must be created
- [x] TUI command routing now uses active surface handlers over global keymap commands
- [x] worktree creation flow and write-side actions have explicit command-handler wiring in `apps/tui`
- [x] configured window picker now calls `runtime-tmux` to create selected windows/panes and skips windows that already exist
- [x] Active tab actions can launch configured window picker for the selected active project/workspace/module runtime
- [x] `runtime-tmux` has write-side API to ensure a semantic runtime session, create configured windows, create named panes, and send optional pane commands
- [ ] hide already-existing configured windows from the picker later
