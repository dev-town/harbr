# Harbr

Harbr is a terminal-native workspace orchestrator for developers working with Git repositories, monorepos, worktrees, tmux sessions, local agents, and future remote sandbox agents.

Harbr is not an IDE, terminal multiplexer, Git client, or AI coding tool. It is the control layer that understands development contexts and helps you create, navigate, restore, and jump into the right runtime.

Core model:

```text
Project -> Workspace -> Module -> Runtime
```

Git remains the source of truth for repository state. tmux remains the main local runtime. Harbr observes, reconciles, and coordinates them.

## Current Status

Built today:

- TUI popover with Active and Browse tabs.
- Project -> workspace -> module drilldown.
- Config loading, validation, and normalization.
- Git/worktree scanning and module expansion.
- SQLite state and migrations.
- Reconciler flow from config/scanner/runtime facts into the database.
- tmux session discovery, open/create, close, and configured window/pane creation.
- CLI sync entrypoint.

Known gaps:

- Full worktree creation wiring is still incomplete.
- Durable events and OpenTelemetry export are deferred until product/debugging needs justify them.
- Some docs describe the target product, not only current behavior.

## Install

Harbr uses Bun workspaces and Turborepo.

```sh
bun install
```

Build everything:

```sh
bun run build
```

Build only the TUI:

```sh
bun run build:tui
```

Build the single Harbr binary:

```sh
bun run build:tui
```

Build outputs:

- App: `apps/tui/dist/harbr`
- Headless sync: `apps/tui/dist/harbr sync`

## Config

Default config path:

```text
~/.config/harbr/config.json
```

Default database path:

```text
~/.local/share/harbr/harbr.db
```

Minimal config:

```json
{
  "$schema": "./packages/config/harbour.schema.json",
  "projects": [
    {
      "name": "harbr",
      "repo": "/path/to/repo",
      "modules": [".", "apps/", "packages/"]
    }
  ]
}
```

Config with reusable tmux windows:

```json
{
  "$schema": "./packages/config/harbour.schema.json",
  "windows": [
    {
      "name": "Shell",
      "panes": [{ "name": "Shell" }]
    },
    {
      "name": "Dev",
      "panes": [
        { "name": "Server", "command": "bun run dev" },
        { "name": "Tests", "command": ["bun run test", "bun run lint"] }
      ]
    }
  ],
  "projects": [
    {
      "name": "harbr",
      "repo": "/path/to/repo",
      "modules": [".", "apps/", "packages/"],
      "windows": ["Shell", "Dev"]
    }
  ]
}
```

Config notes:

- `repo` may use `~` and is resolved to an absolute path.
- `modules` are repo-relative selectors.
- Use `.` for the repo root module.
- Use a trailing slash like `apps/` or `packages/` to expand child directories.
- Absolute module paths and `/` are rejected.
- Project-level `windows` can reference global window names or define inline windows.
- A project can set `"windows": []` to disable global windows for that project.
- Pane `cwd` is optional and is resolved relative to the runtime cwd.
- Pane `command` may be a string or an array of strings.

## Run

Start the TUI from source:

```sh
bun run --cwd apps/tui start
```

Start the TUI with explicit config and database paths:

```sh
bun run --cwd apps/tui start -- --path ~/.config/harbr/config.json --db-path ~/.local/share/harbr/harbr.db
```

Run the compiled TUI:

```sh
./apps/tui/dist/harbr
```

Run headless sync from source:

```sh
bun run --cwd apps/tui start -- sync
```

Run headless sync with JSON output:

```sh
bun run --cwd apps/tui start -- sync --json
```

Run headless sync with an explicit config path:

```sh
bun run --cwd apps/tui start -- sync --path ~/.config/harbr/config.json
```

## TUI Usage

The TUI starts on the Active tab when possible. It can restore context from the current tmux session, then falls back to saved UI context in the Harbr database.

Core keys:

- `Tab`: next tab.
- `Shift+Tab`: previous tab.
- `j` / `Down`: move down.
- `k` / `Up`: move up.
- `Ctrl+D` / `PageDown`: page down.
- `Ctrl+U` / `PageUp`: page up.
- `/` or `i`: focus search.
- `Esc`: clear search, go back, close modal, or close from the root list.
- `Enter`: select, drill down, switch session, or attach/create runtime depending on context.
- `Ctrl+F`: toggle Active/All visibility in Browse.
- `Ctrl+A`: open contextual actions.
- `Ctrl+R`: refresh projects and runtimes.
- `?`: show help.
- `Ctrl+C`: quit.

Common flows:

- Browse projects, workspaces, and modules from the Browse tab.
- Press `Enter` on a leaf context to open an existing tmux session or create one.
- Use the Active tab to switch between currently open Harbr tmux runtimes.
- Use `Ctrl+A` to open context actions such as open/start or configured window creation.
- Use configured windows to create tmux windows and panes with optional startup commands.

## tmux Popup Setup

Harbr is designed to be launched inside a tmux popup.

Example tmux binding:

```tmux
bind-key -r p display-popup -B -E -d "#{pane_current_path}" -w 80% -h 60% -x C -y C "$HOME/bin/tmux-open-harbr-tui"
```

Option notes:

- `-B`: borderless popup. Requires a newer tmux version.
- `-E`: close the popup when Harbr exits.
- `-d "#{pane_current_path}"`: launch from the current pane directory.
- `-w 80% -h 60%`: popup width and height.
- `-x C -y C`: center the popup.

If your tmux does not support `-B`, remove it:

```tmux
bind-key -r p display-popup -E -d "#{pane_current_path}" -w 80% -h 60% -x C -y C "$HOME/bin/tmux-open-harbr-tui"
```

If you want the popup near the status line and your tmux supports it, use `-y S`:

```tmux
bind-key -r p display-popup -B -E -d "#{pane_current_path}" -w 80% -h 60% -y S "$HOME/bin/tmux-open-harbr-tui"
```

tmux does not expose a general popup padding option. `-B` removes the tmux border, but Harbr currently renders with one cell of app padding around the shell.

## Launcher Script

Example `tmux-open-harbr-tui` script:

```bash
#!/usr/bin/env bash

set -euo pipefail

export PATH="$HOME/.bun/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

exec "$HOME/bin/harbr"
```

Make it executable:

```sh
chmod +x "$HOME/bin/tmux-open-harbr-tui"
```

Development launcher variant:

```bash
#!/usr/bin/env bash

set -euo pipefail

export PATH="$HOME/.bun/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

exec bun run --cwd "/path/to/harbr/apps/tui" start
```

## tmux Runtime Names

Harbr uses semantic tmux session names for created runtimes:

```text
project
project~~workspace
project~~workspace~~module
```

Examples:

```text
harbr
harbr~~main
harbr~~main~~apps/tui
```

Session segments escape tmux-dangerous characters such as `~`, `:`, `.`, and `%`. Existing tmux sessions without `~~` are treated as project-level sessions named after the tmux session.

## Repo Structure

```text
apps/
  tui/                 OpenTUI React app

packages/
  config/              config schema, loading, validation, normalization
  db/                  SQLite client, schema, migrations, project snapshots
  domain/              shared domain types
  git/                 Git repository and workspace inspection
  reconciler/          sync/reconcile programs
  runtime-tmux/        tmux runtime adapter
  scanner/             project/workspace/module scanning
  test-utils/          shared test helpers

docs/                  product, architecture, and UX notes
```

## Development

Run checks:

```sh
bun run check
```

Individual checks:

```sh
bun run lint
bun run test
bun run typecheck
bun run format:check
```

### Database Migrations

When changing `packages/db/src/schema.ts`, generate Drizzle SQL first, then generate Harbour's compiled-binary-safe migration wrappers:

```sh
bun run --cwd packages/db db:generate -- --name your_migration_name
bun run --cwd packages/db db:migration
bun run check:migrations
```

Commit both the Drizzle output and generated wrappers:

```text
packages/db/drizzle/**
packages/db/src/migrations/**
packages/db/src/migrations.gen.ts
```

`db:generate` updates Drizzle SQL and journal files. `db:migration` converts those SQL migrations into TypeScript modules embedded in the compiled TUI/CLI binaries.

Format:

```sh
bun run format
```

## Docs

Useful docs:

- `docs/harbour-product-brief.md`
- `docs/harbour-technical-architecture.md`
- `docs/harbour-tmux-popover-ux-spec.md`
- `docs/build-status.md`
