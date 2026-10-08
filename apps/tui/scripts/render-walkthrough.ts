#!/usr/bin/env bun

import { execFileSync, spawnSync } from 'node:child_process'
import { copyFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import ffmpeg from '@ffmpeg-installer/ffmpeg'

import type { Clip, WalkthroughProps } from '../video/walkthrough'

const repoRoot = path.resolve(import.meta.dirname, '../../..')
const appRoot = path.resolve(import.meta.dirname, '..')
const outputRoot = path.resolve(
  process.argv[2] ??
    path.join(repoRoot, '.artifacts', 'terminal-control', 'walkthrough'),
)
const clipsPath = path.join(outputRoot, 'clips')
const introPath = process.env.HARBR_DEMO_INTRO
if (introPath) {
  await copyFile(
    path.resolve(introPath),
    path.join(clipsPath, '00-devtown-intro.mp4'),
  )
}
const clipFiles = (await readdir(clipsPath))
  .filter((file) => /^(?:00|0[1-4]|99)-[\w-]+\.mp4$/.test(file))
  .sort()

if (clipFiles.length === 0) {
  throw new Error(`No numbered MP4 clips found in ${clipsPath}`)
}

const clips: Clip[] = clipFiles.map((file) => {
  const number = file.slice(0, 2)
  const kind = number === '00' ? 'intro' : number === '99' ? 'outro' : 'feature'
  const title = file
    .replace(/^\d\d-/, '')
    .replace(/\.mp4$/, '')
    .replaceAll('-', ' ')
    .replace(/^./, (letter) => letter.toUpperCase())
  return {
    file,
    kind,
    number,
    title,
    frames: Math.max(
      1,
      Math.floor(probeDuration(path.join(clipsPath, file)) * 30),
    ),
  }
})

const propsPath = path.join(outputRoot, 'remotion-props.json')
await writeFile(
  propsPath,
  JSON.stringify({ clips } satisfies WalkthroughProps, null, 2),
)

const outputPath = path.join(outputRoot, 'launch-cut-1080p.mp4')
const remotion = path.join(repoRoot, 'node_modules', '.bin', 'remotion')
execFileSync(
  remotion,
  [
    'render',
    path.join(appRoot, 'video', 'index.ts'),
    'HarbrWalkthrough',
    outputPath,
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
  ],
  { cwd: repoRoot, stdio: 'inherit' },
)
const alsoPath = path.join(clipsPath, '05-also-features.mp4')
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
  ],
  { cwd: repoRoot, stdio: 'inherit' },
)
console.log(
  `Rendered ${clips.length} source clips with an Also card: ${outputPath}`,
)

function probeDuration(file: string) {
  const result = spawnSync(ffmpeg.path, ['-i', file], { encoding: 'utf8' })
  const match = result.stderr?.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/)
  if (!match)
    throw new Error(`Could not read duration from ${file}: ${result.stderr}`)
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
}
