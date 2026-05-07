# Harbour Product Brief

## Purpose

Harbour is a terminal-native workspace orchestrator for developers who work with Git repositories, monorepos, worktrees, tmux sessions, local AI agents, and future remote sandbox agents.

Harbour is not a terminal multiplexer, IDE, Git client, or AI coding tool. It is the control layer that understands the user's development contexts and helps them create, navigate, restore, and jump into the right runtime.

The core idea is:

```text
Project → Workspace → App → Runtime
```

Git remains the source of truth. tmux remains the main local runtime. Harbour coordinates them.

---

## Core Model

### Project

A project is a Git repository root. It may be a normal repository, a bare repository with worktrees, a single-package repo, or a monorepo.

A project does not automatically create a tmux session. It is a source-level container that owns configuration, workspaces, app discovery, runtime metadata, and agent state.

### Workspace

A workspace is a working copy of a project, usually backed by a Git worktree. It represents `main`, a feature branch, a bugfix, a chore, a spike, or an agent-created attempt.

A workspace does not automatically create a tmux session. It is a Git working context that can later have one or more runtimes attached.

### App

An app is a meaningful subdirectory inside a workspace. In a monorepo this might be an app, service, package, infra directory, or docs area. In a single-package repo, the app can simply be `root`.

Apps are launch targets. They may have default commands or layout templates, but they are not required to have live runtimes.

### Runtime

A runtime is an actual working environment. Initially this means a tmux session, but the model should allow future runtime types such as remote sandboxes or agent workers.

A runtime can be created from a project, workspace, or app. Sessions are created lazily when the user asks to jump into that context.

---

## Important Design Principle

Harbour should separate domain identity from runtime state.

```text
Project / Workspace / App = persistent domain model
Runtime / tmux session     = optional execution state
```

The user must be able to browse projects, workspaces, and apps even when no tmux sessions exist.

---

## Interface Direction

Harbour should feel like a calm, fast, keyboard-first TUI inspired by yazi, lazygit, television, and k9s.

The primary interface is a nested selector, not a dashboard.

```text
┌───────────────┬──────────────────┬────────────────────┬────────────────────┐
│ Projects      │ Workspaces       │ Apps               │ Runtimes / Actions │
│ advice        │ main             │ root               │ tmux open          │
│ ideas         │ fix-auth         │ api                │ create session     │
│ veg-patch     │ onboarding-flow  │ capture            │ attach agent       │
└───────────────┴──────────────────┴────────────────────┴────────────────────┘
```

Each column depends on the selected item before it. Selecting a project shows its workspaces. Selecting a workspace shows apps inside it. Selecting an app shows relevant runtimes and actions.

The UI should answer only:

```text
Where am I?
What is selected?
What can I do next?
```

Avoid large dashboards, verbose previews, unrelated right-side panels, and excessive status information.

---

## What to Show at Each Level

### Project Level

Show lightweight project state only:

- Project name
- Active workspace count
- Attention marker if any workspace needs review
- Dirty marker if any workspace has changes

Project actions:

- View workspaces
- Create workspace/task
- Create or jump to optional project-level runtime
- Open Git UI at project root
- Open file browser at project root
- Rescan project
- Edit project config

Do not show app lists, logs, pane details, diffs, or agent internals at this level.

### Workspace Level

Show workspace/task state:

- Workspace name
- Branch/status
- Dirty/review/running indicator
- Active runtime count if relevant
- Agent summary if relevant

Workspace actions:

- View apps
- Create or jump to workspace runtime
- Open Git UI in workspace root
- Open file browser in workspace root
- Show diff
- Rename or delete workspace
- Show workspace agents

### App Level

Show app runtime state:

- App name
- Runtime status: open, closed, running, failed
- Agent status if present
- Dirty marker if changes exist in that app path

App actions:

- Create or jump to app runtime
- Restore app layout
- Start or attach local agent
- Open Git UI scoped to workspace
- Open file browser at app path
- Show app-scoped diff

### Runtime Level

Show live execution state:

- Runtime type: tmux, local agent, remote sandbox
- Runtime name
- Status
- Last activity

Runtime actions:

- Attach or jump
- Restore layout
- Kill runtime
- Show logs
- Sync result if agent-produced

---

## tmux Integration

tmux is the main local runtime. Harbour should create sessions lazily and jump to existing ones when available.

Recommended session names should be predictable and parseable:

```text
project/workspace
project/workspace/app
```

Examples:

```text
advice/main
advice/fix-auth
advice/fix-auth/capture
advice/fix-auth/api
```

Harbour should support both runtime styles:

1. App-session mode: one tmux session per app context.
2. Workspace-session mode: one tmux session per workspace, with windows per app.

This should be configurable per project. The app must not hard-code one model.

---

## Worktree Behaviour

Creating a workspace creates a Git worktree, but does not automatically create a tmux session unless the project config says to do so.

A typical workspace creation asks for:

- Type: feature, bugfix, chore, spike
- Name
- Base branch
- Optional affected apps

The workspace then appears under the selected project and can be opened later.

---

## Agent Model

Agents are optional workers attached to a project, workspace, or app. Initially an agent may simply be a local process such as OpenCode running inside a tmux pane or session.

Future agents may run in remote sandboxes such as Daytona or Cloudflare Sandboxes.

Agent statuses:

```text
idle
queued
running
blocked
done
failed
synced
```

Agent actions:

- Attach
- View logs
- View diff
- Sync result
- Stop
- Retry

Remote agents should produce reviewable Git changes, ideally through a branch. Git should be the sync protocol.

---

## SQLite State

Harbour should maintain local SQLite state for configuration, cached runtime metadata, and history.

Core entities:

- Projects
- Workspaces
- Apps
- Runtimes
- tmux sessions
- Agents
- Events
- Layout templates

The database is not the ultimate source of truth for Git or tmux. Harbour should reconcile stored state with actual Git worktrees and tmux sessions.

---

## Configuration

A project config should define things like:

```yaml
name: advice
repo: ~/repos/advice.git
worktrees: ~/worktrees/advice
mainBranch: main
monorepo: true
runtimeMode: app-session

apps:
  - name: api
    path: apps/api
  - name: capture
    path: apps/capture
  - name: core
    path: packages/core
```

App-specific runtime templates may define panes, commands, and whether commands should auto-start, prompt, or stay manual.

---

## Key UX Flows

### Opening existing work

The user opens Harbour from tmux, selects a project, then a workspace, then an app. If a runtime exists, Harbour jumps to it. If not, Harbour offers to create one.

### Creating a task

The user selects a project and creates a new workspace. Harbour creates the Git worktree and records it. No tmux session is created until the user opens a runtime.

### Working in a monorepo

The user selects a workspace and then chooses an app/package inside it. Each app can have its own runtime, or the workspace can have one runtime with app windows, depending on project configuration.

### Working in a single-package repo

The project has one implicit app named `root`. The hierarchy still works, but Harbour can omit `root` from display or session names when appropriate.

### Starting an agent

The user selects an app and starts an agent. Harbour records the agent, launches it in the configured runtime, and shows only minimal inline status until the user chooses to inspect it.

### Syncing remote work

A remote agent works on a branch, reports status, and finishes. Harbour lets the user view the diff and sync the branch into the local workspace for review and merge.

---

## Keybindings

Suggested TUI keys:

```text
j/k        move
h          back
l/enter    open/select
n          new
a          actions
/          search
?          help
q          quit
```

Suggested tmux bindings outside Harbour:

```text
prefix + w    open Harbour
prefix + z    tmux zoom
prefix + g    lazygit popup
prefix + y    yazi popup
```

Most project/workspace/app management should happen inside Harbour rather than through many tmux leader bindings.

---

## End Goal

Harbour should become a beautiful, minimal TUI control plane for development workspaces.

The user should be able to understand and act on:

```text
what projects exist
what workspaces exist
what apps are available
what runtimes are open
what agents are running
what needs attention
where to jump next
```

without being overwhelmed.

The best version of Harbour feels like a nested selector for development contexts, not a monitoring dashboard.

Harbour is the missing orchestration layer between Git, worktrees, tmux, monorepos, local agents, and remote coding sandboxes.
