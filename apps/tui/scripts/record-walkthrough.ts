#!/usr/bin/env bun

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import { setTimeout } from 'node:timers/promises'

import ffmpeg from '@ffmpeg-installer/ffmpeg'
import { resolveTerminalControlBinary } from '@kitlangton/terminal-control'

const repoRoot = path.resolve(import.meta.dirname, '../../..')
const appRoot = path.resolve(import.meta.dirname, '..')
const outputRoot = path.resolve(
  process.argv[2] ??
    path.join(repoRoot, '.artifacts', 'terminal-control', 'walkthrough'),
)
const recordingPath = path.join(outputRoot, 'walkthrough.termctrl')
const editPath = path.join(outputRoot, 'edit.json')
const videoPath = path.join(outputRoot, 'walkthrough.mp4')
const launchDraftPath = path.join(outputRoot, 'launch-draft-1080p.mp4')
const fixtureRoot = await mkdtemp('/tmp/hw-')
const runtimeDir = path.join(fixtureRoot, 'runtime')
const tmuxSocketPath = path.join(fixtureRoot, 'tmux.sock')
const tmuxConfigPath = path.join(fixtureRoot, 'tmux.conf')
const popupScriptPath = path.join(fixtureRoot, 'open-harbr.sh')
const configPath = path.join(fixtureRoot, 'config.json')
const dbPath = path.join(fixtureRoot, 'harbr.sqlite')
const atlasPath = path.join(fixtureRoot, 'atlas')
const atlasWorktreePath = path.join(fixtureRoot, 'atlas-launch')
const studioPath = path.join(fixtureRoot, 'studio')
const lumenPath = path.join(fixtureRoot, 'lumen')
const relayPath = path.join(fixtureRoot, 'relay')
const beaconPath = path.join(fixtureRoot, 'beacon')
const docsPath = path.join(fixtureRoot, 'docs')
const sessionName = `harbr-walkthrough-${process.pid}`
const termctrl = resolveTerminalControlBinary()
const environment = { ...process.env }

delete environment.TMUX
delete environment.HERDR_SOCKET_PATH
delete environment.HERDR_WORKSPACE_ID
delete environment.HERDR_PANE_ID
environment.TERMCTRL_RUNTIME_DIR = runtimeDir
environment.PATH = `${path.dirname(ffmpeg.path)}${path.delimiter}${environment.PATH ?? ''}`

await mkdir(outputRoot, { recursive: true })
await mkdir(runtimeDir, { recursive: true })
await chmod(runtimeDir, 0o700)

try {
  await setupFixture()
  run('bun', ['run', 'build'], appRoot)
  runTmux([
    '-f',
    tmuxConfigPath,
    'new-session',
    '-d',
    '-s',
    'Atlas',
    '-c',
    atlasPath,
    "printf 'ATLAS  /  WEB\\n$ git status -sb\\n'; git status -sb; exec sleep 600",
  ])
  runTmux([
    'new-session',
    '-d',
    '-s',
    'Studio',
    '-c',
    studioPath,
    "printf 'STUDIO  /  DESIGN SYSTEM\\n$ git status -sb\\n'; git status -sb; exec sleep 600",
  ])
  runTmux([
    'new-session',
    '-d',
    '-s',
    'Relay',
    '-c',
    relayPath,
    "printf 'RELAY  /  CLI\\n$ git status -sb\\n'; git status -sb; exec sleep 600",
  ])
  runTmux([
    'new-session',
    '-d',
    '-s',
    'Lumen~~main~~apps/api',
    '-c',
    path.join(lumenPath, 'apps', 'api'),
    "printf 'LUMEN  /  API\\n$ git status -sb\\n'; git status -sb; exec sleep 600",
  ])

  run(termctrl, [
    'start',
    '--host',
    'opentui',
    '--cols',
    '160',
    '--rows',
    '44',
    '--cwd',
    repoRoot,
    '--record',
    recordingPath,
    sessionName,
    '--',
    'tmux',
    '-S',
    tmuxSocketPath,
    'attach-session',
    '-t',
    'Atlas',
  ])

  try {
    waitFor('ATLAS  /  WEB')
    mark('start')
    await hold(700)

    openHarbr()
    waitFor('Filter active sessions')
    await hold(350)
    mark('active')
    await hold()

    send('text:Studio')
    await hold(650)
    send('enter')
    waitFor('STUDIO  /  DESIGN SYSTEM')
    mark('studio')
    await hold(900)

    openHarbr()
    waitFor('Filter active sessions')
    await hold(350)
    send('tab')
    waitFor('Filter projects')
    await hold(350)
    mark('browse')
    await hold()

    send('text:Atlas')
    await hold(550)
    send('enter')
    waitFor('Filter workspaces')
    await hold(350)
    mark('workspaces')
    await hold()

    send('down')
    await hold(350)
    send('enter')
    waitFor('Filter modules')
    await hold(350)
    mark('modules')
    await hold()

    send('text:?')
    waitFor('Keyboard Help')
    await hold(350)
    mark('help')
    await hold(1_100)
    send('escape')
    await hold(350)

    send('ctrl-a')
    waitFor('Create module windows')
    await hold(400)
    send('down')
    await hold(350)
    send('enter')
    waitFor('2 panes')
    await hold(350)
    mark('layout')
    await hold(1_100)

    send('enter')
    await hold(950)
    runTmux(['select-window', '-t', '=Atlas~~atlas-launch~~apps/web:Run'])
    runTmux([
      'send-keys',
      '-t',
      '=Atlas~~atlas-launch~~apps/web:Run.0',
      'git status -sb',
      'Enter',
    ])
    runTmux([
      'send-keys',
      '-t',
      '=Atlas~~atlas-launch~~apps/web:Run.1',
      'ls -1',
      'Enter',
    ])
    await hold(700)
    mark('created')
    await hold(800)
    mark('end')
  } finally {
    run(termctrl, ['stop', sessionName], repoRoot, { allowFailure: true })
  }

  await writeFile(
    editPath,
    JSON.stringify(
      {
        clips: [
          { from: 'active', to: 'studio' },
          { from: 'studio', to: 'modules' },
          { from: 'modules', to: 'end' },
        ],
      },
      null,
      2,
    ),
  )
  run(termctrl, [
    'video',
    recordingPath,
    '--edit',
    editPath,
    '--hide-cursor',
    '--font-family',
    'JetBrainsMonoNL Nerd Font Mono, Menlo, monospace',
    '--padding',
    '32',
    '--fps',
    '30',
    '--tail-ms',
    '600',
    '--out',
    videoPath,
  ])
  renderLaunchDraft()
  for (const marker of ['active', 'browse', 'layout', 'created']) {
    run(termctrl, [
      'save',
      '--recording',
      recordingPath,
      '--at-marker',
      marker,
      '--format',
      'png',
      '--hide-cursor',
      '--font-family',
      'JetBrainsMonoNL Nerd Font Mono, Menlo, monospace',
      '--out',
      path.join(outputRoot, `${marker}.png`),
    ])
  }
  console.log(`Video: ${videoPath}`)
  console.log(`Launch draft: ${launchDraftPath}`)
  console.log(`Recording, edit plan, and frames: ${outputRoot}`)
} finally {
  runTmux(['kill-server'], { allowFailure: true })
  await rm(fixtureRoot, { force: true, recursive: true })
}

async function setupFixture() {
  await createRepo(atlasPath, ['apps/web', 'packages/core'])
  run('git', [
    '-C',
    atlasPath,
    'worktree',
    'add',
    '-b',
    'feature/launch',
    atlasWorktreePath,
  ])
  await createRepo(studioPath, [])
  await createRepo(lumenPath, ['apps/api', 'packages/ui'])
  await createRepo(relayPath, [])
  await createRepo(beaconPath, [])
  await createRepo(docsPath, [])

  await writeFile(
    configPath,
    JSON.stringify({
      theme: 'tokyonight',
      projects: [
        {
          name: 'Atlas',
          repo: atlasPath,
          modules: ['apps/web', 'packages/core'],
          windows: [
            { name: 'Agent', panes: [{ name: 'OpenCode' }] },
            { name: 'Run', panes: [{ name: 'Server' }, { name: 'Shell' }] },
          ],
        },
        { name: 'Studio', repo: studioPath },
        {
          name: 'Lumen',
          repo: lumenPath,
          modules: ['apps/api', 'packages/ui'],
        },
        { name: 'Relay', repo: relayPath },
        { name: 'Beacon', repo: beaconPath },
        { name: 'Docs', repo: docsPath },
      ],
    }),
  )
  await writeFile(
    popupScriptPath,
    [
      '#!/bin/sh',
      `exec "${path.join(appRoot, 'dist', 'harbr')}" --path "${configPath}" --db-path "${dbPath}"`,
      '',
    ].join('\n'),
  )
  await chmod(popupScriptPath, 0o700)
  await writeFile(
    tmuxConfigPath,
    [
      'set -g prefix C-s',
      'unbind C-b',
      'set -g status-position top',
      'set -g status-style "bg=#1e1e2e,fg=#cdd6f4"',
      'set -g status-left "#[fg=#89b4fa,bold] #S "',
      'set -g status-left-length 60',
      'set -g status-right "#[fg=#6c7086] %H:%M "',
      'set -g default-shell /bin/sh',
      'set -g default-command /bin/sh',
      'set -g mouse off',
      'set -g pane-border-lines double',
      `bind-key -r s display-popup -B -E -d "#{pane_current_path}" -w 80% -h 60% -x C -y C "${popupScriptPath}"`,
      '',
    ].join('\n'),
  )
}

async function createRepo(repoPath: string, modules: string[]) {
  await mkdir(repoPath, { recursive: true })
  await writeFile(path.join(repoPath, 'README.md'), '# Demo repository\n')
  for (const module of modules) {
    const modulePath = path.join(repoPath, module)
    await mkdir(modulePath, { recursive: true })
    await writeFile(path.join(modulePath, 'README.md'), `# ${module}\n`)
    await writeFile(
      path.join(modulePath, 'package.json'),
      JSON.stringify({ name: module.replace('/', '-'), private: true }),
    )
    await mkdir(path.join(modulePath, 'src'), { recursive: true })
    await writeFile(path.join(modulePath, 'src', 'index.ts'), 'export {}\n')
  }
  run('git', ['init', '-b', 'main', repoPath])
  run('git', ['-C', repoPath, 'add', '.'])
  run('git', [
    '-C',
    repoPath,
    '-c',
    'user.name=Harbr Demo',
    '-c',
    'user.email=demo@example.invalid',
    'commit',
    '-m',
    'Create demo repository',
  ])
}

function openHarbr() {
  send('ctrl-s')
  send('text:s')
}

function waitFor(text: string) {
  run(termctrl, ['wait', sessionName, text, '--timeout', '15000'])
}

function send(...keys: string[]) {
  run(termctrl, ['send', sessionName, ...keys])
}

function mark(name: string) {
  run(termctrl, ['mark', sessionName, name])
}

function renderLaunchDraft() {
  const markers = new Map(
    run(termctrl, ['markers', recordingPath])
      .trim()
      .split('\n')
      .map((line) => {
        const [milliseconds, name] = line.trim().split(/\s+/, 2)
        return [name, Number(milliseconds)] as const
      }),
  )
  const active = markers.get('active')
  const studio = markers.get('studio')
  const modules = markers.get('modules')
  const layout = markers.get('layout')
  const end = markers.get('end')
  if (
    active === undefined ||
    studio === undefined ||
    modules === undefined ||
    layout === undefined ||
    end === undefined
  ) {
    throw new Error('Walkthrough recording is missing a required marker')
  }

  const candidateFont = path.join(
    homedir(),
    'Library',
    'Fonts',
    'JetBrainsMonoNLNerdFontMono-Bold.ttf',
  )
  const fontPath =
    process.env.HARBR_VIDEO_FONT ??
    (existsSync(candidateFont)
      ? candidateFont
      : '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf')
  if (!existsSync(fontPath)) {
    throw new Error(`No video font found at ${fontPath}; set HARBR_VIDEO_FONT`)
  }

  const seconds = (marker: number) => ((marker - active) / 1000).toFixed(2)
  const headline = (copy: string, from: number, to: number) =>
    `drawtext=fontfile=${fontPath}:text='${copy}':fontcolor=0xCDD6F4:fontsize=40:x=72:y=132:enable='between(t,${seconds(from)},${seconds(to)})'`
  const filter = [
    'scale=1920:1080:force_original_aspect_ratio=decrease',
    'pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0b0f19',
    `drawtext=fontfile=${fontPath}:text='HARBR':fontcolor=0x89B4FA:fontsize=22:x=w-tw-72:y=100`,
    headline('Jump between live sessions', active, studio),
    headline('Find the right repo and package', studio, modules),
    headline('Stay in flow with the keyboard', modules, layout),
    headline('Launch the layout you need', layout, end + 600),
    'format=yuv420p',
  ].join(',')
  run(ffmpeg.path, [
    '-y',
    '-i',
    videoPath,
    '-vf',
    filter,
    '-c:v',
    'libx264',
    '-crf',
    '18',
    '-preset',
    'medium',
    '-movflags',
    '+faststart',
    launchDraftPath,
  ])
}

async function hold(duration = 850) {
  await setTimeout(duration)
}

function runTmux(args: string[], options: { allowFailure?: boolean } = {}) {
  return run('tmux', ['-S', tmuxSocketPath, ...args], repoRoot, options)
}

function run(
  command: string,
  args: string[],
  cwd = repoRoot,
  options: { allowFailure?: boolean } = {},
) {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      env: environment,
      timeout: 120_000,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (error) {
    if (options.allowFailure) return ''
    const details = error as Error & { stderr?: string; stdout?: string }
    throw new Error(
      [
        `${command} ${args.join(' ')} failed`,
        details.stderr?.trim(),
        details.stdout?.trim(),
        details.message,
      ]
        .filter(Boolean)
        .join('\n'),
      { cause: error },
    )
  }
}
