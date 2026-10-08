# Harbr

Harbr is a terminal-native workspace orchestrator for developers working with Git repositories, monorepos, worktrees, tmux or Herdr runtimes, and configured command layouts.

Harbr is not an IDE, terminal multiplexer, Git client, or AI coding tool. It is the control layer that understands development contexts and helps you create, navigate, restore, and jump into the right runtime.

Core model:

```text
Project -> Workspace -> Module -> Runtime
```

Git remains the source of truth for repository state. The environment that launches Harbr selects the current tmux server or Herdr session as its runtime source. Harbr observes, reconciles, and coordinates them while keeping project configuration provider-neutral.

## Screenshots

Browse projects, workspaces, and modules from a tmux popup:

![Harbr Browse tab showing module selection](docs/assets/readme/browse-modules.png)

Switch between active Harbr runtimes:

![Harbr Active tab showing running sessions](docs/assets/readme/active-sessions.png)

Focused popup view:

![Harbr tmux popup focused on active sessions](docs/assets/readme/active-sessions-popup.png)

## Current Status

Built today:

- TUI popover with Active and Browse tabs.
- Project -> workspace -> module drilldown.
- Config loading, validation, and normalization.
- Git/worktree scanning and module expansion.
- SQLite state and migrations.
- Reconciler flow from validated config intent, scanner facts, and runtime facts into the database.
- tmux session discovery, open/create, close, and configured window/pane creation.
- Herdr workspace discovery plus project, workspace, and module open/create/focus.
- Workspace creation that creates Git worktrees.
- Configured window/pane layout loading into project, workspace, and module sessions.
- CLI sync entrypoint.

## Roadmap

- Durable events and OpenTelemetry export when product/debugging needs justify them.
- Richer local agent workflows built on configured tmux layouts.
- Remote sandbox or agent runtimes if the local runtime model proves out.

## Requirements

To run Harbr locally:

- macOS or Linux on x64 or ARM64.
- Git with worktree support.
- tmux or [Herdr](https://herdr.dev/) for local runtimes and popup usage. If tmux `display-popup -B` fails, remove `-B` from the binding.

To build from source or work on this repo:

- Bun `1.3.14`.

## Install

### Installer

Install the latest stable release to `~/.local/bin`:

```sh
curl -fsSL https://dev-town.com/labs/harbr/install.sh | sh
```

Until the first stable release, install a specific beta by passing the version to the installer process:

```sh
curl -fsSL https://dev-town.com/labs/harbr/install.sh | \
  HARBR_VERSION=0.1.0-beta.5 sh
```

Override the installation directory if needed:

```sh
curl -fsSL https://dev-town.com/labs/harbr/install.sh | \
  HARBR_INSTALL_DIR="$HOME/bin" sh
```

The installer downloads the matching macOS or Linux release archive from GitHub and verifies it against the release's `SHA256SUMS` file before installing `harbr`.

### Homebrew

Install with Homebrew:

```sh
brew tap dev-town/tap
brew install dev-town/tap/harbr
```

After tapping, you can also trust the tap and install by the short formula name:

```sh
brew trust dev-town/tap
brew install harbr
```

Update an existing Homebrew install:

```sh
brew update
brew upgrade dev-town/tap/harbr
harbr --version
```

If Homebrew still reports an older Harbr version after `brew update`, reset the tap and check again:

```sh
brew update-reset dev-town/tap
brew info dev-town/tap/harbr
```

### From Source

Harbr uses Bun workspaces and Turborepo. From a checkout of this repo:

```sh
bun install
```

Build the single Harbr binary:

```sh
bun run build:tui
```

Build output:

- Binary: `apps/tui/dist/harbr`
- Headless sync: `apps/tui/dist/harbr sync`

## Run

Run the installed binary:

```sh
harbr
```

Run the source-built binary:

```sh
./apps/tui/dist/harbr
```

Run headless sync:

```sh
harbr sync
```

Run headless sync with JSON output:

```sh
harbr sync --json
```

Run with explicit config and database paths:

```sh
harbr --path ~/.config/harbr/config.json --db-path ~/.local/share/harbr/harbr.db
```

## Local Profiling

Harbr can export local OpenTelemetry traces for boot and sync debugging. Start the local Jaeger/OTLP stack:

```sh
harbr profile up
```

Run Harbr with profiling enabled:

```sh
harbr --profile
```

Profile headless sync:

```sh
harbr sync --profile
```

Open the Jaeger UI:

```sh
harbr profile url
```

The default OTLP endpoint is `http://localhost:4318`. Use `--profile-endpoint <url>` or `HARBR_OTLP_ENDPOINT` to export to a different local collector. Stop the local stack with:

```sh
harbr profile down
```

When profiling is enabled and no collector is reachable, Harbr exits with a message telling you to run `harbr profile up`.

## Config

Default config path:

```text
~/.config/harbr/config.json
```

Default database path:

```text
~/.local/share/harbr/harbr.db
```

Example config:

```json
{
  "$schema": "https://raw.githubusercontent.com/dev-town/harbr/main/packages/config/harbr.schema.json",
  "theme": "system",
  "projects": [
    {
      "name": "harbr",
      "repo": "~/Sites/harbr/harbr.git",
      "modules": [".", "apps/", "packages/"]
    },
    {
      "name": "myweddin",
      "repo": "~/Sites/myweddin/",
      "modules": [".", "apps/", "packages/"]
    },
    {
      "name": "DevTown 2026",
      "repo": "~/Sites/devtown-2026/devtown.git"
    },
    {
      "name": "Dotfiles",
      "repo": "~/.dotfiles/"
    }
  ],
  "windows": [
    {
      "name": "Agent",
      "panes": [
        {
          "name": "Opencode",
          "command": "opencode"
        },
        {
          "name": "CLI"
        }
      ]
    },
    {
      "name": "Editor",
      "panes": [
        {
          "name": "Neovim",
          "command": "nvim"
        },
        {
          "name": "CLI"
        }
      ]
    }
  ]
}
```

Config notes:

- `theme` is optional and defaults to `system`.
- Supported themes: `system`, `tokyonight`, `everforest`, `ayu`, `catppuccin`, `catppuccin-macchiato`, `gruvbox`, `kanagawa`, `nord`, and `atom-one-dark`.
- `repo` may use `~` and is resolved to an absolute path.
- `repo` can point at a normal checkout or a bare Git directory.
- Harbr discovers existing Git worktrees wherever Git reports them.
- Harbr-created worktrees are stored under `~/.local/share/harbr/worktrees/<project>/<workspace>`.
- `modules` are repo-relative selectors.
- Use `.` for the repo root module.
- Use a trailing slash like `apps/` or `packages/` to expand child directories.
- Absolute module paths and `/` are rejected.
- `windows` define reusable runtime window/pane layouts. Layout application currently targets tmux; Herdr layout support is still in progress.
- Loading a layout creates missing configured windows and panes in the target session.
- Existing configured windows are skipped, not duplicated.
- Project-level `windows` can reference global window names or define inline windows.
- A project can set `"windows": []` to disable global windows for that project.
- Pane `cwd` is optional and is resolved relative to the runtime cwd.
- Pane `command` may be a string or an array of strings.

## TUI Usage

The TUI starts on the Active tab when possible. It restores context from the focused runtime in the current tmux server or Herdr session, then falls back to saved UI context in the Harbr database.

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
- Press `Enter` on a leaf context to focus an existing runtime or create one in the current provider.
- Use the Active tab to switch between currently open Harbr runtimes in the current tmux server or Herdr session.
- Use `Ctrl+A` to open context actions such as open/start, workspace creation, or configured layout loading.
- Create a workspace to create a Git worktree, then open/start that workspace as a runtime.
- Load configured layouts to create tmux windows and panes with optional startup commands.

## tmux Popup Setup

Harbr is designed to be launched inside a tmux popup.

Example tmux binding:

```tmux
bind-key -r H display-popup -B -E -d "#{pane_current_path}" -w 80% -h 60% -x C -y C "$HOME/bin/harbr"
```

Use any key you prefer. `prefix + p` is widely used by tmux users, so `prefix + H` or `prefix + S` is usually safer.

During local development, point the binding at the built binary:

```tmux
bind-key -r H display-popup -B -E -d "#{pane_current_path}" -w 80% -h 60% -x C -y C "<repo>/apps/tui/dist/harbr"
```

Option notes:

- `-B`: borderless popup. Requires a newer tmux version.
- `-E`: close the popup when Harbr exits.
- `-d "#{pane_current_path}"`: launch from the current pane directory.
- `-w 80% -h 60%`: popup width and height.
- `-x C -y C`: center the popup.

If your tmux does not support `-B`, remove it:

```tmux
bind-key -r H display-popup -E -d "#{pane_current_path}" -w 80% -h 60% -x C -y C "$HOME/bin/harbr"
```

## Herdr Popup Setup

Install Harbr's Herdr plugin:

```sh
herdr plugin install dev-town/harbr/herdr-plugin
```

Then bind its open action in `~/.config/herdr/config.toml`:

```toml
[[keys.command]]
key = "prefix+shift+h"
type = "plugin_action"
command = "dev-town.harbr.open"
description = "Open Harbr"
```

Herdr plugins cannot install keybindings, so choose another key if `prefix+shift+h` conflicts with your configuration. Restart Herdr or reload its configuration after saving the binding. The plugin requires `harbr` on the shell path Herdr receives.

For Herdr versions without plugin support, use the legacy custom-command popup:

```toml
[[keys.command]]
key = "prefix+shift+h"
type = "popup"
command = "harbr"
description = "Open Harbr"
width = "80%"
height = "60%"
```

When launched from this popup, Harbr scopes Active and Browse to the current Herdr session. Selecting a project, workspace, or module focuses its existing Herdr workspace by workspace ID, or creates and focuses a workspace rooted at that context's resolved working directory. The popup closes after a successful jump.

## tmux Runtime Names

Harbr uses semantic tmux session names for created runtimes:

```text
project
project~~workspace
project~~workspace~~module
```

Examples:

```text
shop
shop~~feature-checkout
shop~~feature-checkout~~apps/web
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
  reconciler/          sync/reconcile services
  runtime/             provider-neutral runtime capabilities
  runtime-herdr/       Herdr runtime adapter
  runtime-tmux/        tmux runtime adapter
  scanner/             project/workspace/module scanning
  test-utils/          shared test helpers

docs/                  product, architecture, and UX notes
```

## Working On The Repo

Install dependencies:

```sh
bun install
```

Start the TUI from source:

```sh
bun run --cwd apps/tui start
```

Run headless sync from source:

```sh
bun run --cwd apps/tui start -- sync
```

Build everything:

```sh
bun run build
```

Build the TUI binary:

```sh
bun run build:tui
```

### Release Notes

Harbr uses Changesets for release notes and version bumps. Feature, fix, and security PRs should include a changeset:

```sh
bun changeset
```

For user-facing binary changes, select `@harbr/tui`. While Harbr is in beta, Changesets prerelease mode keeps those Version Packages PRs on the `-beta.N` line. After changesets land on `main`, GitHub Actions opens or updates a `Version Packages` PR that updates package versions and changelogs. Merge that version PR when ready to release, then tag the resulting `main` commit.

Run checks:

```sh
bun run check
```

Run the popup end-to-end flows (requires `tmux`):

```sh
bun run test:e2e:terminal-control
```

This builds the TUI, opens Harbr through a centered tmux popup in a private tmux server, and checks Active session switching, Browse navigation, keyboard help, and configured window and pane creation. The test creates disposable Git repositories and a worktree; it does not use your running tmux server or Harbr database. Failure recordings are saved under `.artifacts/terminal-control/e2e/`.

Record a draft product walkthrough (requires `tmux`):

```sh
bun run record:walkthrough
```

The recorder builds Harbr, creates disposable Git repositories and tmux sessions, then captures the outer tmux window as Harbr switches active sessions, browses a monorepo, shows keyboard help, and creates a configured layout. The demo starts real Neovim and isolated Zsh shells using your Starship theme when available. It writes an editable terminal-control recording, review frames, and four ordered MP4 feature clips to `.artifacts/terminal-control/walkthrough/`. The private tmux server uses a small Catppuccin-style status configuration and does not load your full tmux or Zsh plugin setup.

To show a live agent in the created `Agent` window, set `HARBR_DEMO_AGENT_COMMAND` to its launch command before recording. For example, `HARBR_DEMO_AGENT_COMMAND=opencode bun run record:walkthrough`. This is optional: a live agent may depend on local credentials or network access, while the default recording remains repeatable.

Render the launch cut with Remotion:

```sh
bun run render:walkthrough
```

The renderer reads numbered MP4 files from `.artifacts/terminal-control/walkthrough/clips/` in filename order. Add an optional `00-intro.mp4` and `99-outro.mp4` there, then rerun the renderer; the intro and outro play as supplied. Each feature clip gets its own animated title card derived from its filename. The result is `launch-cut-1080p.mp4`. To edit a feature without re-recording, replace its numbered MP4 and rerender.

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

### Effect Runtime Shape

Harbr packages expose Effect service tags, API types, and live layers. Packages should not export convenience helper functions that secretly provide live implementations.

Runtime choices such as config and database paths are represented as option services:

```text
ConfigServiceOptions -> ConfigServiceLive
DatabaseClientOptions -> DatabaseClientLive -> ProjectServiceLive
```

`apps/tui` composes package live layers and option layers into one app layer, then creates one shared Effect runtime when the interactive TUI launches. TUI actions and data helpers run programs through that shared runtime and request services explicitly:

```ts
Effect.gen(function* () {
  const runtime = yield* RuntimeService

  return yield* runtime.openOrCreateRuntime(target)
})
```

One-shot commands such as `harbr sync` create an app runtime for the command and dispose it after rendering output.

Format:

```sh
bun run format
```
