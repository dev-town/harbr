# Harbour Technical Architecture

Harbour is a terminal-native workspace orchestrator for developers working with Git repositories, monorepos, worktrees, tmux sessions, local agents, and future remote sandbox agents.

Harbour is not an IDE, terminal multiplexer, Git client, or AI coding assistant. It is the control layer that understands development contexts and helps users create, navigate, restore, and jump into the right runtime.

Core model:

```text
Project → Workspace → Module → Runtime
```

Core principle:

```text
Project / Workspace / Module = persistent domain model
Runtime / tmux session     = optional execution state
```

Git and tmux remain external sources of truth. Harbour observes, reconciles, and coordinates them.

---

## Architecture Style

Harbour uses a lightweight DDD-inspired, controller/reconciler-oriented architecture.

That means:

```text
observed external state
→ scanners
→ facts
→ reconciler
→ SQLite/Drizzle state
→ TUI view state
```

And user actions flow back out:

```text
key press
→ command id
→ command handler
→ domain action
→ git/tmux/runtime adapter
→ external state changes
→ scanners observe again
```

The database is not the ultimate source of truth for Git or tmux. It stores Harbour’s durable metadata, cache, and history.

---

## Tech Stack

### Runtime

- Bun
- TypeScript
- Turborepo

### TUI

- OpenTUI React
- Jotai for UI/session state
- `@opentui/keymap` for keybinding contexts and command routing

### Persistence

- SQLite
- Drizzle ORM
- Drizzle migrations from day one

### Orchestration

- Effect for scanners, reconcilers, adapters, pipelines, errors, retries, scheduling, dependency injection, logs, and spans
- Effect should not be used inside React/OpenTUI components except at app/service boundaries

### Observability

- Use Effect logs and spans directly when needed.
- Keep OpenTelemetry export deferred until slow-debugging needs justify it.
- Add append-only history only if Harbour needs product-visible or auditable change records.

### Config

- JSON config
- JSON Schema via `$schema`
- Runtime validation using Zod or Effect Schema

### Testing

- Vitest
- TDD at architectural boundaries
- Prefer dependency injection over mocks
- Test scanners, reconcilers, adapters, config loading, repositories, and command handlers

### Code Quality

- ESLint latest flat config
- `eslint-plugin-boundaries` at repo root
- TypeScript strict mode
- Prettier
- shared config packages inside the monorepo

### Agent Development

- OpenCode
- `AGENTS.md`
- repo-local agent skills
- repo checks via scripts/tooling

---

## Monorepo Structure

```text
harbour/
  apps/
    tui/
    cli/

  packages/
    domain/
    db/
    config/
    git/
    runtime-tmux/
    scanner/
    reconciler/
    keymap/
    ui/
    test-utils/

    config-typescript/
    config-eslint/
    config-prettier/
    config-vitest/

  agent/
    AGENTS.md

  .agents/
    skills/
      architecture/
        SKILL.md
      testing/
        SKILL.md
      boundaries/
        SKILL.md
      effect/
        SKILL.md
      drizzle/
        SKILL.md
      opentui/
        SKILL.md

  scripts/
    check.ts
    doctor.ts
    setup.ts

  turbo.json
  package.json
  tsconfig.json
  eslint.config.mjs
  prettier.config.mjs
```

---

## Package Responsibilities

### `apps/tui`

The interactive OpenTUI application.

Owns:

- app bootstrap
- OpenTUI render tree
- Jotai store setup
- keyboard input routing
- command palette
- screen layout
- subscriptions to Harbour state
- execution of command handlers
- starting/stopping Effect runtime fibers

Depends on:

```text
@harbour/domain
@harbour/db
@harbour/config
@harbour/scanner
@harbour/reconciler
@harbour/runtime-tmux
apps/tui keymap
```

Must not contain:

- Drizzle schema
- raw SQL
- raw git command logic
- raw tmux command logic
- reconciliation logic

---

## Dependency Boundaries

Allowed dependency direction:

```text
apps/*
  → packages/*

ui
  → domain

keymap
  → domain

db
  → domain

config
  → domain

git
  → domain

runtime-tmux
  → domain

scanner
  → domain
  → config
  → git

reconciler
  → domain
  → db
  → scanner

test-utils
  → domain
  → db
  → config
```

Forbidden:

```text
domain → anything
ui → db
ui → git
ui → runtime-tmux
ui → scanner
ui → reconciler
keymap → db
db → scanner
db → reconciler
scanner → runtime-tmux
runtime-tmux → db
git → db
```

---

## Final Mental Model

```text
domain        = Harbour language
config        = user/project intent
git/tmux      = external reality adapters
scanner       = what exists?
reconciler    = what changed and what should Harbour believe?
db            = what Harbour remembers
keymap        = key → command
ui            = what the user sees
apps          = how the user enters Harbour
agent skills  = how agents stay inside the architecture
```

Harbour should feel instant, calm, sparse, and reliable.

The goal is not to show everything.

The goal is to help the user jump to the right development context.
