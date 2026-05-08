## Mental Model

Use this doc for fast orientation and architecture reviews.

### Core idea

Harbour is not an IDE, terminal multiplexer, Git client, or AI coding assistant.

It is the control layer that understands development contexts and helps users create, navigate, restore, and jump into the right runtime.

### Core model

```text
Project -> Workspace -> Module -> Runtime
```

Persistent domain model:

```text
Project / Workspace / Module = durable Harbour concepts
Runtime / tmux session     = optional execution state
```

Git and tmux remain external sources of truth. Harbour observes and reconciles them.

### Architecture style

Harbour uses a lightweight DDD-inspired, controller/reconciler-oriented architecture.

Read path:

```text
observed external state
-> scanners
-> facts/events
-> reconciler
-> SQLite/Drizzle state
-> TUI view state
```

Write path:

```text
key press
-> command id
-> command handler
-> domain action
-> git/tmux/runtime adapter
-> external state changes
-> scanners observe again
```

### Translation table

```text
domain        = Harbour language
config        = user/project intent
git/tmux      = external reality adapters
scanner       = what exists?
reconciler    = what changed and what should Harbour believe?
db            = what Harbour remembers
events        = why things changed
observability = what happened internally
keymap        = key -> command
ui            = what the user sees
apps          = how the user enters Harbour
agent skills  = how agents stay inside the architecture
```

### Product feel

Harbour should feel instant, calm, sparse, and reliable.

The goal is not to show everything.

The goal is to help the user jump to the right development context.
