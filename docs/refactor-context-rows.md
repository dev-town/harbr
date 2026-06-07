# Context Row Runtime Refactor

## Problem

The TUI currently has separate row models for Browse and Active.

- Browse renders Harbour context rows: project, workspace, module.
- Active renders `ActiveRuntimeRow`, a separate flattened runtime projection.
- Actions then need route-specific resolution to turn rows back into project/workspace/module runtime targets.

This causes drift. A selected Active row is still fundamentally a project, workspace, or module, but action code does not treat it as the same row shape as Browse.

Recent window creation work exposed this: Browse actions could resolve runtime targets from loaded browse rows, but Active actions for non-focused sessions needed a temporary pre-resolved runtime target because the matching browse rows were not always loaded.

## Goal

Use one Harbour context row model across Browse and Active.

Active should render all active Harbour sessions globally. These can be project, workspace, or module contexts. Active should not render tmux sessions that are not recognized as Harbour contexts.

Browse should render scoped Harbour context rows. Active should render the same row shape filtered to rows with runtime attached.

## Target Model

All actionable TUI rows are Harbour context rows:

```ts
type HarbourRow = ProjectRow | WorkspaceRow | ModuleRow
```

Each row has a resolved context target and a required nullable runtime attachment:

```ts
type ProjectRow = BaseRow & {
  kind: 'project'
  target: ResolvedContextTarget
  runtime: RuntimeAttachment | null
}

type WorkspaceRow = BaseRow & {
  kind: 'workspace'
  target: ResolvedContextTarget
  runtime: RuntimeAttachment | null
}

type ModuleRow = BaseRow & {
  kind: 'module'
  target: ResolvedContextTarget
  runtime: RuntimeAttachment | null
}
```

`runtime` is required but nullable so every mapper must explicitly decide runtime state.

## Domain Types

Move the shared runtime target contract into `domain` so `db`, `runtime-tmux`, and `apps/tui` can share it without invalid package edges.

```ts
type RuntimeTarget = {
  cwd: string
  moduleName: string | null
  projectName: string
  workspaceName: string | null
}
```

Add resolved context and runtime attachment contracts to `domain`:

```ts
type ResolvedContextTarget = {
  breadcrumb: string
  context: HarbourContext
  label: string
  runtimeTarget: RuntimeTarget
  scope: 'project' | 'workspace' | 'module'
}

type RuntimeAttachment = {
  sessionName: string
  status: RuntimeStatus
}
```

`sessionName` is runtime metadata only. It is not Harbour row identity and should not be predicted for inactive rows.

## Runtime Overlay

Rows without active Harbour runtime state use:

```ts
runtime: null
```

Rows with active Harbour runtime state use:

```ts
runtime: {
  sessionName,
  status,
}
```

Current focused runtime is derived in TUI selectors:

```ts
const isCurrent = row.runtime?.sessionName === currentRuntime?.sessionName
```

This keeps the row as a Harbour context and treats runtime state as an attachment.

## Browse Tab

Browse renders scoped Harbour rows:

- Projects scope renders `ProjectRow[]`.
- Workspaces scope renders `WorkspaceRow[]`.
- Modules scope renders `ModuleRow[]`.

Rows may or may not have `runtime` attached.

Browse labels, active markers, current markers, and actions should derive from the same row fields used by Active.

## Active Tab

Active renders all active Harbour rows globally:

```ts
const activeRows = allHarbourRows.filter((row) => row.runtime !== null)
```

Active should not have a separate `ActiveRuntimeRow` context model.

If TypeScript needs to prove runtime is present, use a local type guard instead of introducing a product-level row type:

```ts
function hasRuntime(
  row: HarbourRow,
): row is HarbourRow & { runtime: RuntimeAttachment } {
  return row.runtime !== null
}
```

## Actions

Actions should consume Harbour rows or resolved context targets, not route-specific row projections.

Context actions use:

```ts
row.target
```

Runtime-only actions use:

```ts
row.runtime
```

Examples:

- Open/start project, workspace, module: `row.target.runtimeTarget`
- Create configured windows: `row.target.runtimeTarget`
- Close session: `row.runtime.sessionName`
- Disable close current session: compare `row.runtime.sessionName` to current runtime session name

Action row shape should become route-agnostic:

```ts
type ContextActionRow = {
  actionId: string
  disabledNotice?: string
  id: string
  kind: 'action'
  label: string
  runtime: RuntimeAttachment | null
  target: ResolvedContextTarget
}
```

## DB Responsibility

DB owns persisted Harbour context state and persisted/observed Harbour runtime state. DB does not own tmux behavior.

DB summary reads should expose enough data to build `ResolvedContextTarget` for each row without relying on currently loaded parent rows in the TUI.

For workspace summaries, include project-level fields needed for target construction:

```ts
projectName
repoPath
```

For module summaries, include project and workspace fields needed for target construction:

```ts
projectName
repoPath
workspaceName
workspacePath
```

Summary outputs should also include nullable `RuntimeAttachment` for matching active Harbour runtimes.

DB can also expose a resolver for command paths that only have IDs:

```ts
resolveContextTarget(context: HarbourContext): Effect<ResolvedContextTarget | null, DbError>
```

This resolver is useful for command execution and safety, but TUI row actions should usually already have `row.target` available.

## Runtime-Tmux Responsibility

`runtime-tmux` consumes `RuntimeTarget` from `domain`.

It remains responsible for tmux behavior:

- derive or find the concrete tmux session
- create missing sessions
- create windows and panes
- skip windows that already exist
- send pane commands
- switch active tmux client

`runtime-tmux` should not know about DB rows or TUI rows.

## Migration Order

1. Add `RuntimeTarget`, `ResolvedContextTarget`, and `RuntimeAttachment` to `domain`.
2. Update `runtime-tmux` to import `RuntimeTarget` from `domain`.
3. Update DB summary contracts and repos to return self-sufficient context target fields and nullable runtime attachment.
4. Update TUI row types so `ProjectRow`, `WorkspaceRow`, and `ModuleRow` all include `target` and `runtime`.
5. Update TUI row mappers to build `ResolvedContextTarget` and runtime attachment.
6. Replace `ActiveRuntimeRow` usage with `HarbourRow` filtered to `runtime !== null`.
7. Unify Browse and Active action row payloads around `ResolvedContextTarget` and nullable `RuntimeAttachment`.
8. Remove temporary window-picker `runtimeTarget` surface workaround.
9. Update action handlers to use `row.target.runtimeTarget` and `row.runtime`.
10. Run full check.

## Non-Goals

- Do not render non-Harbour tmux sessions in Active.
- Do not put TUI row types in `domain`.
- Do not make tmux session naming Harbour row identity.
- Do not predict `sessionName` for rows without actual runtime attachment.
- Do not make DB responsible for tmux orchestration.

## Verification

- Browse can open/start project, workspace, and module runtimes.
- Browse can create configured windows for project, workspace, and module rows.
- Active shows all active Harbour project/workspace/module sessions globally.
- Active can open, close, and create configured windows for non-focused sessions.
- Current markers are accurate in both Browse and Active.
- Existing configured windows are skipped, not duplicated.
- TUI no longer needs currently loaded Browse rows to execute Active actions.
- `runtime-tmux` has no dependency on `db` or TUI code.
