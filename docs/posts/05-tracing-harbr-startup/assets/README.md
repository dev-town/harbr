# Post 5 assets

## `early-active-popup.png`

- Genuine Harbr UI capture from 26 June 2026, three days before local profiling
  was added.
- Original:
  `/Users/andy/Sites/harbour/main/docs/assets/readme/active-sessions-popup.png`
- Useful as the “what the user was waiting to see” image.
- It is not a profiling screenshot and must not be captioned as one.

## Missing historical trace screenshot

The 29 June task contains pasted trace values and detailed discussion, but no
reusable Jaeger bitmap was recovered from the stored thread.

Options for the final writer:

1. Use a compact text/table treatment of the historical timings.
2. Run the current profiler and label the screenshot “current tracing view.”
3. Reconstruct the June state from commit `febc2c98f` in a separate Git worktree,
   then label the image as a reconstruction.

Never imply a newly captured trace is the original June screenshot.
