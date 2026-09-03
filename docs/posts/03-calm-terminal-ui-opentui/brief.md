# Post 3 brief: A calm terminal UI

## Working title

**Building a Calm Terminal UI with OpenTUI**

- Historical work window: late June–6 July 2026
- Suggested length: 650–850 words
- Series role: complete the first description of the actual application
- Status: ready for an editorial draft

## Thesis

Designing a TUI is not web design moved into a terminal. Harbr used OpenTUI,
React, and Zustand to build a familiar stateful interface, but the design had to
respect a grid of terminal cells, user-controlled fonts and font sizes, discrete
spacing, keyboard focus, limited viewport sizes, and terminal-dependent colour
behaviour.

Those constraints helped reinforce the desired product feel: calm, sparse, and
focused on getting the user to the right development context.

## Suggested narrative

1. Begin with the early popup screenshot: it looks like an application, but it
   lives inside the developer's terminal and tmux workflow.
2. Explain why OpenTUI plus React was attractive: components and stateful UI
   patterns without moving the workflow into a browser or desktop shell.
3. Describe the main UI model: Active shows attached runtimes; Browse moves
   through projects, workspaces, and modules.
4. Discuss terminal constraints as design inputs:
   - the app cannot choose the user's font family or font size;
   - dimensions and padding are expressed in character cells rather than a
     continuous pixel canvas;
   - one extra row or column can be a meaningful amount of space;
   - narrow popups and terminal resizing require layout restraint;
   - focus, keybindings, selection, and escape behaviour are central interaction
     design;
   - colours must remain semantic across terminal environments and themes.
5. Introduce semantic theme tokens rather than describing every palette.
6. Mention automated theme scenarios and configuration validation as the
   guardrail that kept visual choices testable.
7. Close with the lesson: TUI restrictions can create focus rather than merely
   remove visual options.

## Implementation context

- OpenTUI provides the terminal rendering and React binding.
- Zustand stores app, browse, active, modal, data, and form state.
- Keymap layers assign priorities to root, route, and modal bindings.
- View rows are app-local projections derived from domain data.
- The theme system uses semantic tokens such as `text`, `muted`, `accent`,
  `active`, `warning`, `error`, `selection`, and `border`.
- The `system` theme can react to detected light/dark terminal mode; named themes
  provide predictable palettes.

This is enough technical context. Avoid explaining every store slice or
component.

## Historically accurate claims

- The three included screenshots were committed on 26 June 2026.
- The dedicated theme work was explored from 2 July and landed in commit
  `9e7a55bb5` on 6 July.
- At that point the theme list included system, Tokyo Night, Everforest, Ayu,
  Catppuccin variants, Gruvbox, Kanagawa, Nord, and Atom One Dark.
- The screenshot shows a historical repository/session name using `harbour`.

## Avoid

- Do not imply a TUI can control terminal font size or typography like a web app.
- Do not call the UI pixel-perfect.
- Do not turn the article into an OpenTUI API tutorial.
- Do not claim every terminal renders colours or glyph widths identically.
- Do not present the list of themes as the main product achievement.

## Local evidence

- Theme planning task:
  `/Users/andy/.codex/sessions/2026/07/02/rollout-2026-07-02T19-13-05-019f2408-d246-7582-acf4-3391583f4fcd.jsonl`
- Theme implementation commit: `9e7a55bb5`
- Historical theme implementation:
  `git show 9e7a55bb5:apps/tui/src/config/theme.ts`
- Current theme implementation and tests:
  `/Users/andy/Sites/harbour/main/apps/tui/src/config/theme.ts`
  `/Users/andy/Sites/harbour/main/apps/tui/src/config/theme.test.ts`
- Current layout and shell components:
  `/Users/andy/Sites/harbour/main/apps/tui/src/components/layout/index.tsx`
  `/Users/andy/Sites/harbour/main/apps/tui/src/components/shell/index.tsx`
- Current Active/Browse routes:
  `/Users/andy/Sites/harbour/main/apps/tui/src/routes/active/route.tsx`
  `/Users/andy/Sites/harbour/main/apps/tui/src/routes/browse/route.tsx`
- Current state root:
  `/Users/andy/Sites/harbour/main/apps/tui/src/store/app-store.ts`
- Keymap layers and priorities:
  `/Users/andy/Sites/harbour/main/apps/tui/src/keymap/layers.tsx`
  `/Users/andy/Sites/harbour/main/apps/tui/src/keymap/priorities.ts`
- OpenTUI first-party repository:
  `https://github.com/anomalyco/opentui`

## Assets

See `assets/README.md`. The full-terminal screenshot best communicates that
Harbr is part of an existing terminal workflow; the Browse screenshot supports
the navigation and spacing discussion.
