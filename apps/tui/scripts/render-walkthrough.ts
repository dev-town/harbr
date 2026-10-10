#!/usr/bin/env bun

import { execFileSync, spawnSync } from 'node:child_process'
import { copyFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import ffmpeg from '@ffmpeg-installer/ffmpeg'

import { totalFrames, type Clip, type WalkthroughProps } from '../video/walkthrough'

const repoRoot = path.resolve(import.meta.dirname, '../../..')
const appRoot = path.resolve(import.meta.dirname, '..')
const outputRoot = path.resolve(
  process.argv[2] ?? path.join(repoRoot, '.artifacts', 'terminal-control', 'walkthrough'),
)
const clipsPath = path.join(outputRoot, 'clips')
const musicPath = process.env.HARBR_DEMO_MUSIC?.trim()
const browserExecutable = process.env.HARBR_DEMO_BROWSER_EXECUTABLE?.trim()
const browserArgs = browserExecutable
  ? ['--browser-executable', path.resolve(browserExecutable)]
  : []
const featureTitles: Record<string, string> = {
  '01-switch-live-sessions.mp4': 'Switch live sessions',
  '02-explore-your-projects-and-packages.mp4': 'Explore your projects and packages',
  '03-quick-search.mp4': 'Quick search',
  '04-custom-layouts.mp4': 'Custom layouts',
  '05-check-help-for-other-features.mp4': 'Check help for other features',
}
const introPath = path.resolve(
  process.env.HARBR_DEMO_INTRO ??
    path.join(appRoot, 'video', 'assets', 'devtown-tilde-to-labs.mp4'),
)
await copyFile(introPath, path.join(clipsPath, '00-devtown-intro.mp4'))
const clipFiles = (await readdir(clipsPath))
  .filter((file) => /^(?:00|0[1-5]|99)-[\w-]+\.mp4$/.test(file))
  .sort()

if (clipFiles.length === 0) {
  throw new Error(`No numbered MP4 clips found in ${clipsPath}`)
}

const clips: Clip[] = clipFiles.map((file) => {
  const number = file.slice(0, 2)
  const kind = number === '00' ? 'intro' : number === '99' ? 'outro' : 'feature'
  const title =
    featureTitles[file] ??
    file
      .replace(/^\d\d-/, '')
      .replace(/\.mp4$/, '')
      .replaceAll('-', ' ')
      .replace(/^./, (letter) => letter.toUpperCase())
  return {
    file,
    kind,
    number,
    title,
    frames: Math.max(1, Math.floor(probeDuration(path.join(clipsPath, file)) * 30)),
  }
})

const propsPath = path.join(outputRoot, 'remotion-props.json')
await writeFile(propsPath, JSON.stringify({ clips } satisfies WalkthroughProps, null, 2))

const outputPath = path.join(outputRoot, 'launch-cut-1080p.mp4')
const renderPath = musicPath ? path.join(outputRoot, 'launch-cut-no-music.mp4') : outputPath
const remotion = path.join(repoRoot, 'node_modules', '.bin', 'remotion')
execFileSync(
  remotion,
  [
    'render',
    path.join(appRoot, 'video', 'index.ts'),
    'HarbrWalkthrough',
    renderPath,
    '--props',
    propsPath,
    '--public-dir',
    clipsPath,
    '--codec',
    'h264',
    '--pixel-format',
    'yuv420p',
    '--concurrency',
    '2',
    ...browserArgs,
  ],
  { cwd: repoRoot, stdio: 'inherit' },
)
if (musicPath) {
  const introSeconds = (clips.find((clip) => clip.kind === 'intro')?.frames ?? 0) / 30
  const outroSeconds = clips
    .filter((clip) => clip.kind === 'outro')
    .reduce((seconds, clip) => seconds + clip.frames / 30, 0)
  const musicStart = introSeconds + 0.1
  const musicDuration = totalFrames(clips) / 30 - outroSeconds - musicStart
  const delay = Math.round(musicStart * 1000)
  const musicFilter = [
    `[0:a]aresample=48000[original]`,
    `[1:a]atrim=duration=${musicDuration},asetpts=PTS-STARTPTS,aresample=48000,` +
      `volume=0.08,afade=t=in:st=0:d=1.5,` +
      `afade=t=out:st=${Math.max(0, musicDuration - 2.84)}:d=2.84,` +
      `adelay=${delay}|${delay}[music]`,
    `[original][music]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,` +
      `alimiter=limit=0.95[mix]`,
  ].join(';')
  execFileSync(
    ffmpeg.path,
    [
      '-hide_banner',
      '-y',
      '-i',
      renderPath,
      '-stream_loop',
      '-1',
      '-i',
      path.resolve(musicPath),
      '-filter_complex',
      musicFilter,
      '-map',
      '0:v:0',
      '-map',
      '[mix]',
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-movflags',
      '+faststart',
      outputPath,
    ],
    { cwd: repoRoot, stdio: 'inherit' },
  )
}
const alsoPath = path.join(clipsPath, '06-also-features.mp4')
execFileSync(
  remotion,
  [
    'render',
    path.join(appRoot, 'video', 'index.ts'),
    'HarbrAlso',
    alsoPath,
    '--codec',
    'h264',
    '--pixel-format',
    'yuv420p',
    '--concurrency',
    '2',
    ...browserArgs,
  ],
  { cwd: repoRoot, stdio: 'inherit' },
)
console.log(`Rendered ${clips.length} source clips with an Also card: ${outputPath}`)

function probeDuration(file: string) {
  const result = spawnSync(ffmpeg.path, ['-i', file], { encoding: 'utf8' })
  const match = result.stderr?.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/)
  if (!match) throw new Error(`Could not read duration from ${file}: ${result.stderr}`)
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
}
