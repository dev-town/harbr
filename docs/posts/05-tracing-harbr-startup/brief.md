# Post 5 brief: Tracing Harbr startup

## Working title

**What We Learned by Tracing Harbr's Startup**

- Historical work windows: 29 June and 29 August 2026
- Suggested length: 650–850 words
- Series role: practical companion to the feedback-loop thesis
- Status: ready for a draft; a trace screenshot is still desirable

## Thesis

“The app feels slow” is not a useful optimisation target until the startup path
is measured. Harbr's local traces separated Git scanning, database work, tmux,
module loading, renderer creation, React commit, and terminal paint. That evidence
prevented effort being spent on components that were not the main delay.

The post should say “faster” and “earlier useful UI,” not “instant.” Harbr still
has startup delay and continued to evolve after the first profiling work.

## Suggested narrative

1. Start with the subjective report: Harbr took a noticeable moment before useful
   results appeared.
2. Add local OpenTelemetry instead of guessing or sending profiling data to a
   hosted service.
3. Describe the first useful trace: the data path was dominated by sequential
   scanner/Git work, not config, SQLite, or tmux.
4. Show the small measured result from that machine: parallel observation reduced
   the profiled sync path substantially.
5. Explain the second lesson: faster persistence did not improve perceived speed
   while the UI still waited for the complete result.
6. Explain why startup instrumentation was extended to module import, Effect
   runtime creation, OpenTUI renderer creation, React commit, and painted frames.
7. Close with the honest product direction: render a useful shell or cached state
   earlier, then refresh external facts in the background.

## Measurements available from the historical task

Use these only as one local measurement, not as a benchmark claim.

Initial compiled TUI data-load trace:

```text
harbr.loadProjects          ~1142 ms
reconciler.syncProjects     ~1134 ms
scanner.observeProjects     ~1114 ms
config.load                    ~7 ms
runtime.tmux.listRuntimes      ~11 ms
DB snapshot writes total       ~20 ms
```

After parallelising project observations and independent Git operations:

```text
harbr.sync                  ~1256 ms -> ~415 ms
scanner.observeProjects     ~1225 ms -> ~387 ms
```

Later front-of-startup measurement from the same thread:

```text
boot elapsed                ~404 ms before data load began
dynamic command import      ~298 ms
OpenTUI renderer creation     ~9 ms
Effect runtime creation       ~2 ms
React render                  ~1 ms
```

The editorial lesson is stronger than the numbers: measuring the entire path
changed the suspected bottleneck. Do not combine these independent runs into one
synthetic total.

## What changed in code

- Project observations ran concurrently while preserving configured result order.
- Default-branch checks and worktree listing could overlap after repo inspection.
- Workspace/module scans could overlap.
- Startup events gained timestamps for app commit, app paint, results commit, and
  results paint.
- A startup shell could be committed before the external scan finished.
- Later startup work recorded a timeline and exported it into one parent span.

## Important nuance

- A per-project “observe then persist” experiment changed trace shape but not
  total UI wait time because the public result still completed as one batch.
- Cached-first or progressive results were identified as the larger perceived
  performance opportunity.
- Current code is newer than the June implementation; use Git history when
  describing the stage.
- The numbers came from one local environment and should not be presented as
  generally reproducible performance.

## Avoid

- Avoid `instant`, `zero-latency`, or a claim that all startup delay was fixed.
- Do not present the 3x local sync improvement as a universal benchmark.
- Do not imply renderer creation was always negligible on every terminal.
- Do not make Jaeger setup the focus of the post.
- Do not imply earlier DB writes helped the UI before a consumer existed.

## Local evidence

- Full profiling/startup task:
  `/Users/andy/.codex/sessions/2026/06/29/rollout-2026-06-29T20-41-27-019f14e6-a218-7ac2-b774-a3d592e8f7a2.jsonl`
- Initial OTEL commit: `fe6fccce4`
- Parallel scanner commit: `b5eceae61`
- Merged profiling work: `febc2c98f`
- Later startup improvement commit: `791545d25`
- Current startup instrumentation:
  `/Users/andy/Sites/harbour/main/apps/tui/src/observability/startup.ts`
  `/Users/andy/Sites/harbour/main/apps/tui/src/observability/startup-timeline.ts`
- Current startup shell:
  `/Users/andy/Sites/harbour/main/apps/tui/src/components/startup-shell/index.tsx`
- Paint/commit markers:
  `/Users/andy/Sites/harbour/main/apps/tui/src/hooks/useAppShell/use-app-shell.ts`
- Project scanning:
  `/Users/andy/Sites/harbour/main/packages/scanner/src/scanner.observe.ts`

## Assets and screenshot plan

See `assets/README.md`.

The historical chat did not retain a reusable Jaeger screenshot. The included
June UI image is a genuine before-state visual. For the final article, capture a
fresh trace only if it can be clearly labelled as a reconstruction or current
implementation rather than the exact June trace.
