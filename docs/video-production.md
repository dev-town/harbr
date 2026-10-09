# Walkthrough video production

The public walkthrough is [`docs/assets/readme/harbr-walkthrough.mp4`](assets/readme/harbr-walkthrough.mp4). Its poster is [`docs/assets/readme/harbr-walkthrough-poster.jpg`](assets/readme/harbr-walkthrough-poster.jpg). The editable composition and recording scripts live in `apps/tui/video/` and `apps/tui/scripts/`.

From the repository root, record the five numbered terminal clips, then render the complete video:

```sh
HARBR_DEMO_APP_COMMAND=lazygit bun run record:walkthrough
HARBR_DEMO_MUSIC=/absolute/path/to/soundoffreedom-rampb-trap-beat-549549.mp3 bun run render:walkthrough
```

The recording command uses disposable Git repositories, tmux sessions, and Harbr configuration. It reads the local Ghostty palette and LazyGit configuration when available. The render command writes `.artifacts/terminal-control/walkthrough/launch-cut-1080p.mp4` and the standalone `06-also-features.mp4` card. These working files are ignored by Git. Review the cut before copying it to the public video path above; update the poster if the opening image changes.

The README plays the copy hosted by the separate DevTown website. After the Harbr video is reviewed, copy the committed MP4 to `apps/website/public/labs/harbr/harbr-walkthrough.mp4` in the DevTown website repository and deploy that site. Until then, the README's hosted link will show the previous cut.

The DevTown Labs intro, including its original audio, is bundled at `apps/tui/video/assets/devtown-tilde-to-labs.mp4`. Set `HARBR_DEMO_INTRO` to another MP4 to change it. The renderer adds the optional background track after the intro, at low volume, and fades it out before an optional `99-*.mp4` outro. If `HARBR_DEMO_MUSIC` is unset, the render has only audio from the source clips.

Remotion normally uses its matching Chrome headless shell. If that browser is already cached elsewhere, set `HARBR_DEMO_BROWSER_EXECUTABLE` to its absolute path. A different system Chrome build previously introduced flashing frames in this walkthrough.

## Music source

- Track: **R&B Trap Beat** (download filename `soundoffreedom-rampb-trap-beat-549549.mp3`), by [soundoffreedom](https://pixabay.com/users/soundoffreedom-50460407/) on Pixabay.
- License: [Pixabay Content License summary](https://pixabay.com/service/license-summary/) and [full terms](https://pixabay.com/service/terms/). Pixabay allows music in a larger creative video; attribution is optional, but we credit the creator here.
- The source MP3 is not committed to this public repository. Keep a local download for rerenders. The published MP4 contains the edited music bed.

The renderer takes clips `01` through `05` in filename order and adds matching feature cards, then the “Also” card and “Try Harbr” end card. A `99-*.mp4` clip can follow as an outro. To revise one feature without recording the whole walkthrough, replace that numbered MP4 in `.artifacts/terminal-control/walkthrough/clips/` and rerun the render command.
