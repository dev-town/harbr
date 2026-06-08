## Build Order

Use this doc when planning implementation sequence or a first vertical slice.

### Package order

1. `domain`
2. `config`
3. `git`
4. `runtime-tmux`
5. `db`
6. `scanner`
7. `reconciler`
8. `ui`
9. `apps/tui`
10. `apps/cli`
11. `test-utils` hardening throughout

### Why this order

- `domain` first because everything else speaks Harbour language.
- `config` before scanner because scan behavior depends on stable project intent.
- `git` and `runtime-tmux` before db because external read models come first.
- `db` before `reconciler` because belief needs durable storage.
- `scanner` before `reconciler` because reconciliation consumes facts.
- `ui` after read model stabilizes so presentation does not invent backend shape.
- `apps/*` after reusable package behavior exists. TUI keybindings are app-local and should be built with the route or modal that owns the behavior.

### First vertical slice

For fastest useful milestone:

1. `domain`: core entities, ids, statuses
2. `config`: load one project config
3. `git`: discover repo and worktrees
4. `runtime-tmux`: list and map tmux sessions
5. `scanner`: emit normalized facts
6. `db`: persist normalized state
7. `reconciler`: sync facts into Harbour state
8. `apps/tui`: render a read-only nested selector

This yields the first real Harbour loop: observe reality, store belief, render contexts, browse without creating anything.

### Milestones

1. Foundation
   Repo config, strict TypeScript, lint boundaries, package deps, test harness.

2. Read model
   `config`, `git`, `runtime-tmux`, `scanner`, `db`, `reconciler`.

3. First product
   Read-only TUI nested selector.

4. Core actions
   Create workspace/worktree, create or jump runtime, rescan.

5. Second wave
   Agents, layout restore, richer CLI, remote runtimes, diagnostics.

### Avoid early

- remote sandbox support
- full agent execution model
- complex layout restoration
- verbose dashboard panels
- rich logs and diff panes
- write-heavy tmux orchestration before browse flow works

### Bias

- adapters wrap Git and tmux
- scanner emits facts only
- reconciler owns belief and state transitions
- TUI reads derived state and dispatches app-local commands/actions
