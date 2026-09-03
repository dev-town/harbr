# Post 1 brief: Introducing Harbr

## Working title

**Introducing Harbr: A Control Layer for Developer Workspaces**

- Historical work window: 24–26 June 2026
- Suggested length: 600–800 words
- Series role: introduce the product before discussing its implementation
- Status: ready for an editorial draft

## Thesis

Harbr began as a small, terminal-native way to move between the development
contexts already spread across Git worktrees and tmux. It was not intended to
replace Git, tmux, an editor, or a coding agent. It was intended to provide a
calm control layer above them.

At this stage tmux was the only implemented runtime. The domain language already
used the broader word `Runtime`, leaving room for later providers without making
the introduction pretend that support existed yet.

## Reader takeaway

A developer's work is more than a folder or terminal session. Harbr gave names
and navigation to four related concepts:

```text
Project -> Workspace -> Module -> Runtime
```

- A project is the repository-level container.
- A workspace is a working copy, usually a Git worktree.
- A module is a meaningful subdirectory in a larger repository or monorepo.
- A runtime was initially a tmux session attached to one of those contexts.

## Suggested narrative

1. Open with the everyday problem: several repositories, worktrees, modules,
   tmux sessions, and agent attempts become hard to navigate consistently.
2. Introduce Harbr as a popup that answers “where am I?” and “where do I want to
   go?”
3. Explain Active versus Browse in one paragraph.
4. Introduce the four-part model without turning it into domain-modelling
   documentation.
5. State the original boundary: Git owns repository truth; tmux owns running
   sessions; Harbr observes and coordinates them.
6. Close with the early design bet: start with tmux, but avoid making the product
   model synonymous with tmux.

## Historically accurate claims

- The original public README described Harbr as a terminal-native workspace
  orchestrator for repositories, monorepos, worktrees, tmux sessions, local
  agents, and possible future remote agents.
- The early TUI had Active and Browse tabs, project/workspace/module drill-down,
  Git scanning, SQLite state, reconciliation, and tmux lifecycle actions.
- Some product documentation described the intended direction as well as the
  behaviour already implemented. Preserve that caveat.
- The repository was renamed from Harbour to Harbr on 24 June 2026.

## Avoid

- Do not say Harbr supported Herdr at launch.
- Do not describe Harbr as an IDE, terminal multiplexer, Git client, or AI coding
  assistant.
- Do not claim it eliminated all navigation friction or was production-complete.
- Do not lead with implementation packages; those belong in post 2.

## Local evidence

- Initial public product wording at commit `263b7e068`:
  `git show 263b7e068:README.md`
- Rename commit: `263b7e068` (`Rename from Harbour to Harbr`)
- Historical README screenshots commit: `9f81a6b70`
- Current product brief:
  `/Users/andy/Sites/harbour/main/docs/harbour-product-brief.md`
- Current concise product statement:
  `/Users/andy/Sites/harbour/main/README.md`
- Mental model:
  `/Users/andy/Sites/harbour/main/.agents/skills/architecture/references/mental-model.md`

## Assets

See `assets/README.md` before using the included screenshot.

Suggested placement: after the opening problem, show the Active popup as the
first tangible view of the product.

## Optional closing bridge

The next post explains why the product was built as a TypeScript monorepo, and
how Bun, Effect, and package boundaries supported the control-layer model.
