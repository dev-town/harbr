# Post 6 brief: Taking Harbr beyond tmux

## Working title

**Taking Harbr Beyond tmux: Adding Herdr as a Runtime**

- Historical work window: 20–30 August 2026
- Suggested length: 750–950 words
- Series role: show the original runtime abstraction becoming real
- Status: ready for a draft after external facts are rechecked

## Thesis

Harbr started with tmux, but its product language described development contexts
rather than tmux primitives. Adding Herdr tested whether that separation was real.
The integration pushed Harbr toward a provider-neutral runtime boundary and
exposed two durable lessons: translate tool-specific concepts at the edge, and
keep stable provider identity separate from mutable terminal paths.

This one post consolidates the earlier ideas about runtime providers, mapping
sessions/windows/panes, stable IDs, and safe reconciliation. Keep it a product
evolution note rather than a five-part implementation diary.

## Explain Herdr first

Herdr is a terminal-native workspace and agent multiplexer. Persistent terminals
run under a background server and are organised into workspaces, tabs, and panes.
It can detect common coding-agent CLIs and surface agent attention/status. Harbr
does not replace Herdr; it maps configured projects, workspaces, and modules onto
Herdr runtimes so the same Harbr navigation model can work there.

Use the carefully sourced wording in `research-external-tools.md`. Herdr has
attracted significant open-source attention, but available primary sources do
not establish an industry-wide adoption rate.

## Suggested narrative

1. Recap the launch-stage bet: tmux was the first runtime, not the product model.
2. Introduce Herdr and why an agent-aware multiplexer was interesting.
3. Explain the vocabulary mismatch lightly:
   - Harbr: project, workspace, module, runtime.
   - tmux: server, session, window, pane.
   - Herdr: session, workspace, tab, pane.
4. Describe the enabling change: extract provider-neutral discovery and lifecycle
   capabilities, then select tmux or Herdr from launch context.
5. Tell the concrete identity lesson: a pane can change directory, so path is
   useful for first discovery but not as the durable identity of a Herdr
   workspace.
6. Explain safe reconciliation in one paragraph: preserve bindings during a
   provider outage; remove them only after a successful snapshot confirms the
   external workspace disappeared.
7. Mention the Harbr Herdr plugin and popup as the user-facing integration.
8. Close by briefly noting Superlogical as a direction worth watching, explicitly
   unsupported by Harbr.

## Important architectural context

The code eventually separated:

- `runtime`: provider-neutral discovery, lifecycle, and layout capabilities;
- `runtime-tmux`: tmux adapter;
- `runtime-herdr`: Herdr adapter;
- `scanner`: read-only observation of the selected provider;
- `reconciler`: durable Harbr belief and binding transitions;
- `apps/tui`: provider selection and user interaction.

Keep this to one compact diagram or paragraph.

## Stable identity lesson

The bug story is useful but should stay approachable:

```text
first observation: pane path helps map a workspace to a Harbr context
later operation: workspace ID is the stable handle
```

If the pane changes directory, Harbr should still focus the same external
workspace by ID. A coincidentally matching path should not steal another
context's binding.

## Superlogical context

The user's “Super Logical” reference is **Superlogical**, Mitchell Hashimoto's
company. Its official site describes a broader multiplexer direction and says
the first terminal multiplexer beta is forthcoming as of the research date.

Mention it only as a related direction worth watching:

- Harbr does not support Superlogical.
- Do not imply a partnership, endorsement, or roadmap commitment.
- Recheck release status immediately before publication.

## Avoid

- Do not call Herdr an AI coding agent; it hosts and observes agent CLIs.
- Do not call Herdr an industry standard or claim a growth rate from GitHub stars.
- Do not expose the five internal issue slices or detailed agent workflow.
- Do not claim every tmux capability maps perfectly to Herdr.
- Do not say Harbr supports Superlogical.
- Do not conflate Superlogical the company with a released product of that name.

## Local evidence

- Initial integration design task:
  `/Users/andy/.codex/sessions/2026/08/20/rollout-2026-08-20T20-36-01-01a020ac-5bbd-72e0-b3c1-670b92d4e6ef.jsonl`
- Provider extraction task:
  `/Users/andy/.codex/sessions/2026/08/25/rollout-2026-08-25T21-38-46-01a03aa5-9b4b-7083-bbca-4ba0e03891fc.jsonl`
- Herdr discovery task:
  `/Users/andy/.codex/sessions/2026/08/25/rollout-2026-08-25T23-17-08-01a03aff-aa35-7732-a5ba-ea886e3d115d.jsonl`
- Open/focus task:
  `/Users/andy/.codex/sessions/2026/08/28/rollout-2026-08-28T12-16-41-01a04816-1527-77c1-a304-0bf027623162.jsonl`
- Close task:
  `/Users/andy/.codex/sessions/2026/08/28/rollout-2026-08-28T12-41-14-01a0482c-8ebc-7640-a667-920ab44cc3ab.jsonl`
- Identity/reconciliation fix task:
  `/Users/andy/.codex/sessions/2026/08/30/rollout-2026-08-30T12-25-29-01a0526a-da09-7640-ba65-2a3509248dd2.jsonl`
- Merged Herdr feature commit: `02c63a4f4`
- Stable binding fix commit: `94c584465`
- Provider-neutral contracts:
  `/Users/andy/Sites/harbour/main/packages/runtime/src`
- Concrete adapters:
  `/Users/andy/Sites/harbour/main/packages/runtime-tmux/src`
  `/Users/andy/Sites/harbour/main/packages/runtime-herdr/src`
- Binding reconciliation:
  `/Users/andy/Sites/harbour/main/packages/reconciler/src/reconciler.runtimes.ts`
- Plugin:
  `/Users/andy/Sites/harbour/main/herdr-plugin`

## Required external research

Read `research-external-tools.md`. It contains primary links, checked wording,
dated repository metrics, and the Superlogical correction.

## Suggested visual

A compact conceptual mapping is more useful than code:

```text
Harbr context model
        |
runtime capability boundary
       / \
    tmux  Herdr
```
