# Contributing

Harbr is maintainer-led public-source software. Issues and pull requests may be considered, but project direction, scope, and release timing are maintainer-owned. Before larger changes, open an issue or discussion first.

## Build from source

Use Bun `1.3.14`. Harbr is a Bun workspace managed with Turborepo.

```sh
bun install
bun run --cwd apps/tui start
```

The source app uses the same config file described in the [README](README.md). To run headless sync from source:

```sh
bun run --cwd apps/tui start -- sync
```

Build the single Harbr binary at `apps/tui/dist/harbr`:

```sh
bun run build:tui
./apps/tui/dist/harbr --version
```

`bun run build` builds the workspace packages. To launch the compiled app in a tmux popup during development, point the [tmux binding](README.md#open-harbr-in-a-tmux-popup) at your checkout's `apps/tui/dist/harbr` binary.

## Checks

Run the project checks before submitting changes:

```sh
bun run check
```

This covers lint, unit tests, installer and Herdr plugin tests, typechecking, migration and config schema checks, and formatting. Individual checks are available when working on one area:

```sh
bun run lint
bun run test
bun run typecheck
bun run format:check
```

Format files with `bun run format`.

The terminal popup end-to-end test requires `tmux`:

```sh
bun run test:e2e:terminal-control
```

It builds the TUI and exercises Active switching, Browse navigation, keyboard help, and configured layouts through a popup in a private tmux server. It creates disposable Git repos and a worktree; it does not use your running tmux server or Harbr database. Failure recordings are saved under `.artifacts/terminal-control/e2e/`.

## Releases

Feature, fix, and security PRs that change the user-facing binary should include a Changeset for `@harbr/tui`:

```sh
bun changeset
```

After Changesets land on `main`, GitHub Actions opens or updates a `Version Packages` PR with the next SemVer version and changelog. A maintainer merges that PR, then creates and pushes the matching tag. See the [release guide](docs/releasing.md) for checks, artifacts, website assets, and Homebrew tap updates.

## Local profiling

Harbr can export local OpenTelemetry traces for boot and sync debugging. Start the local Jaeger/OTLP stack, run Harbr with profiling enabled, and open the Jaeger UI:

```sh
harbr profile up
harbr --profile
harbr profile url
```

`harbr sync --profile` profiles headless sync. The default OTLP endpoint is `http://localhost:4318`; use `--profile-endpoint <url>` or `HARBR_OTLP_ENDPOINT` for a different local collector. Stop the local stack with `harbr profile down`. If profiling is enabled without a reachable collector, Harbr tells you to run `harbr profile up`.

## Database migrations

When changing `packages/db/src/schema.ts`, generate Drizzle SQL first, then generate Harbr's compiled-binary-safe migration wrappers:

```sh
bun run --cwd packages/db db:generate -- --name your_migration_name
bun run --cwd packages/db db:migration
bun run check:migrations
```

Commit both `packages/db/drizzle/**` and the generated `packages/db/src/migrations/**` and `packages/db/src/migrations.gen.ts`. `db:generate` updates Drizzle SQL and journal files; `db:migration` converts the SQL migrations into TypeScript modules embedded in the compiled binary.

## Architecture

```text
apps/
  tui/                 OpenTUI React app

packages/
  config/              config schema, loading, validation, normalization
  db/                  SQLite client, schema, migrations, project snapshots
  domain/              shared domain types
  git/                 Git repository and worktree inspection
  reconciler/          sync/reconcile services
  runtime/             provider-neutral runtime capabilities
  runtime-herdr/       Herdr runtime adapter
  runtime-tmux/        tmux runtime adapter
  scanner/             project/workspace/module scanning
  test-utils/          shared test helpers

docs/                  product, architecture, and UX notes
```

The [technical architecture](docs/harbour-technical-architecture.md) describes the package boundaries. Packages expose Effect service tags, API types, and live layers. Runtime choices such as config and database paths are option services:

```text
ConfigServiceOptions -> ConfigServiceLive
DatabaseClientOptions -> DatabaseClientLive -> ProjectServiceLive
```

`apps/tui` composes live layers and options into one shared Effect runtime for the interactive app. One-shot commands such as `harbr sync` create and dispose their own runtime.

Harbr-created tmux sessions use semantic names: `project`, `project~~workspace`, or `project~~workspace~~module`. Segments escape tmux-sensitive characters such as `~`, `:`, `.`, and `%`. Existing sessions without `~~` are treated as project-level sessions named after the tmux session.

## Walkthrough video

Recreate the walkthrough linked in the README from the repository root. This requires `tmux`; LazyGit provides the filmed backdrop:

```sh
HARBR_DEMO_APP_COMMAND=lazygit bun run record:walkthrough
bun run render:walkthrough
```

The recorder builds Harbr, creates disposable Git repos and tmux sessions, and captures one continuous walkthrough. It writes an editable recording, review frames, and numbered MP4 feature clips under `.artifacts/terminal-control/walkthrough/`. The private tmux server does not load your normal tmux or Zsh plugin setup.

Set `HARBR_DEMO_APP_COMMAND` to another app launch command or omit it to record without an extra app. For LazyGit, the recorder copies `~/.config/lazygit/config.yml` into its disposable fixture; use `HARBR_DEMO_LAZYGIT_CONFIG` to choose another file. It reads `~/.config/ghostty/ghostty-theme` for the outer terminal session; set `HARBR_DEMO_GHOSTTY_THEME` to use a different file. OpenCode can be recorded with `HARBR_DEMO_APP_COMMAND=$HOME/.opencode/bin/opencode`. The recorder uses disposable XDG data and config directories.

The renderer puts the bundled DevTown Labs intro before clips 01–04 and preserves its audio. Set `HARBR_DEMO_INTRO=/absolute/path/to/another-intro.mp4` to replace it, or add a `99-*.mp4` outro. To edit a feature without re-recording, replace its numbered MP4 and rerender. The standalone `05-also-features.mp4` highlights mouse support, Herdr, monorepo navigation, and Git worktrees; the main cut includes it before “Try Harbr.”

| Purpose                             | Location                                                                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Intro and audio                     | [`apps/tui/video/assets/devtown-tilde-to-labs.mp4`](apps/tui/video/assets/devtown-tilde-to-labs.mp4)                                                   |
| Recorder and renderer               | [`record-walkthrough.ts`](apps/tui/scripts/record-walkthrough.ts), [`render-walkthrough.ts`](apps/tui/scripts/render-walkthrough.ts)                   |
| Scene cards and composition         | [`apps/tui/video/walkthrough.tsx`](apps/tui/video/walkthrough.tsx)                                                                                     |
| Editable recording and local render | `.artifacts/terminal-control/walkthrough/` (ignored by Git)                                                                                            |
| Reviewed video and poster           | [`harbr-walkthrough.mp4`](docs/assets/readme/harbr-walkthrough.mp4), [`harbr-walkthrough-poster.jpg`](docs/assets/readme/harbr-walkthrough-poster.jpg) |
