# External tool research: Herdr and Superlogical

Research checked: 1 September 2026. This is background for an editorial writer, not proposed copy. Product details and repository counts are time-sensitive and should be rechecked immediately before publication.

## Herdr

### What it is

Herdr describes itself as “the runtime your coding agents live on.” In practical terms, it is a terminal-native workspace and agent multiplexer: a background server owns persistent terminals, while its interface organises them into workspaces, tabs and panes. A developer can detach and reattach without stopping the agents inside those terminals. Herdr detects common coding-agent CLIs, surfaces states such as working, blocked and idle, and exposes CLI/socket interfaces that agents can use to create panes, run commands and wait for state changes.

This makes it a useful contrast with tmux for the Harbr story. tmux supplies general-purpose terminal multiplexing; Herdr makes coding agents and their attention state part of the product model. Avoid describing Herdr as an agent itself: it runs and observes existing tools such as Claude Code, Codex, Cursor and OpenCode rather than replacing them.

Primary sources:

- [Herdr repository and product overview](https://github.com/herdrdev/herdr)
- [Herdr quick start](https://herdr.dev/docs/quick-start/)
- [Herdr CLI reference](https://herdr.dev/docs/cli-reference/)

### Capabilities worth mentioning lightly

- Persistent background sessions whose terminals continue when a client detaches.
- Project-level workspaces containing tabs, panes and agents.
- Coding-agent detection and visible attention/status states.
- Keyboard and mouse interaction inside an existing terminal, rather than requiring a separate desktop shell.
- A CLI and local socket API, which are especially relevant to Harbr because they provide a structured integration surface.
- Remote access over SSH and an extension/plugin surface. These are current capabilities, but they are peripheral to the Harbr integration story and need not become a feature list.

### Popularity and adoption: what can safely be said

As of 1 September 2026, the canonical public repository shows approximately **34,200 stars and 2,500 forks**, alongside active issues, pull requests and frequent preview/stable releases. Those figures are defensible evidence that Herdr has attracted substantial open-source attention. Its public docs and repository also show a developing integration/plugin ecosystem.

However, the available primary sources provide a current snapshot, not a historical star or active-user time series. They do **not** establish a growth rate, production usage or industry-wide adoption. Do not write “Herdr is becoming an industry standard” or imply that GitHub stars equal users.

Recommended wording:

> Herdr had begun attracting significant attention as an agent-aware alternative to a conventional terminal multiplexer.

Or, even more conservatively:

> Herdr was one of the emerging agent-aware runtimes we wanted Harbr to understand.

If the article publishes much later, recheck the [canonical repository](https://github.com/herdrdev/herdr) and replace the dated counts—or omit the counts and retain the softer wording.

## Superlogical

### Resolving the name

The user’s “Super Logical” reference resolves to **Superlogical**, the company Mitchell Hashimoto co-founded. It is not currently presented as a released product with that name. Hashimoto’s own site identifies him as a Superlogical co-founder, and Superlogical’s official site describes the company’s product direction.

Primary sources:

- [Mitchell Hashimoto’s official site](https://mitchellh.com/)
- [Superlogical’s official site](https://www.superlogical.com/)

### What Superlogical says it is building

Superlogical describes a broader “multiplexer for all work”: a durable session layer intended eventually to connect local development, remote systems, coding agents, background work and production operations. Its stated first step is a terminal multiplexer with long-lived sessions, web and native macOS/iOS access, and live session sharing. The site says a beta for this terminal multiplexer is forthcoming.

That vision is adjacent to Harbr’s evolution from a tmux-only application toward a control layer that can understand more than one runtime. It is useful external context because it suggests that the underlying problem—organising persistent work shared by humans, agents and tools—is larger than any single tmux integration.

### Editorial guardrails

- Describe Superlogical as a **company and product direction**, not a mature or generally available runtime.
- Say its planned multiplexer “looks worth watching” or “points in a similar direction.” Do not call it an alternative users can adopt today unless its release status changes before publication.
- State explicitly that **Harbr does not support Superlogical**. It is mentioned only as evidence of a wider design space.
- Do not imply a partnership, endorsement, shared implementation or roadmap commitment.
- Keep the comparison conceptual. Herdr is a concrete runtime Harbr integrated; Superlogical is a useful signal about where developer workspaces may be heading.

Suggested lightweight passage:

> Herdr is not the only sign that terminal workflows are being reconsidered for an agent-heavy world. Mitchell Hashimoto’s Superlogical is working toward a much broader multiplexer for persistent work across developers, agents and environments. Harbr does not support it, and its terminal product had not yet reached public beta at the time of writing, but the direction is one we are watching.

Recheck the last sentence against [Superlogical’s official site](https://www.superlogical.com/) immediately before publication, because release status may change.
