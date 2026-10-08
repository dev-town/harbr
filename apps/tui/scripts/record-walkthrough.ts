#!/usr/bin/env bun

import { execFileSync } from 'node:child_process'
import { chmod, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
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
const clipsPath = path.join(outputRoot, 'clips')
const fixtureRoot = await mkdtemp('/tmp/hw-')
const runtimeDir = path.join(fixtureRoot, 'runtime')
const zdotDir = path.join(fixtureRoot, 'zdot')
const tmuxSocketPath = path.join(fixtureRoot, 'tmux.sock')
const tmuxConfigPath = path.join(fixtureRoot, 'tmux.conf')
const popupScriptPath = path.join(fixtureRoot, 'open-harbr.sh')
const nvimConfigPath = path.join(fixtureRoot, 'nvim.lua')
const configPath = path.join(fixtureRoot, 'config.json')
const dbPath = path.join(fixtureRoot, 'harbr.sqlite')
const atlasPath = path.join(fixtureRoot, 'atlas')
const atlasWorktreePath = path.join(fixtureRoot, 'atlas-launch')
const studioPath = path.join(fixtureRoot, 'studio')
const lumenPath = path.join(fixtureRoot, 'lumen')
const lumenWorktreePath = path.join(fixtureRoot, 'lumen-launch')
const relayPath = path.join(fixtureRoot, 'relay')
const beaconPath = path.join(fixtureRoot, 'beacon')
const docsPath = path.join(fixtureRoot, 'docs')
const sessionName = `harbr-walkthrough-${process.pid}`
const termctrl = resolveTerminalControlBinary()
const agentCommand = process.env.HARBR_DEMO_AGENT_COMMAND?.trim()
const environment = { ...process.env }

delete environment.TMUX
delete environment.HERDR_SOCKET_PATH
delete environment.HERDR_WORKSPACE_ID
delete environment.HERDR_PANE_ID
environment.TERMCTRL_RUNTIME_DIR = runtimeDir
environment.ZDOTDIR = zdotDir
environment.PATH = `${path.dirname(ffmpeg.path)}${path.delimiter}${environment.PATH ?? ''}`

await mkdir(outputRoot, { recursive: true })
await mkdir(clipsPath, { recursive: true })
await mkdir(runtimeDir, { recursive: true })
await mkdir(zdotDir, { recursive: true })
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
    'exec zsh -i',
  ])
  runTmux([
    'new-session',
    '-d',
    '-s',
    'Studio',
    '-c',
    studioPath,
    'exec zsh -i',
  ])
  runTmux(['new-session', '-d', '-s', 'Relay', '-c', relayPath, 'exec zsh -i'])
  runTmux([
    'new-session',
    '-d',
    '-s',
    'Lumen~~main~~apps/api',
    '-c',
    path.join(lumenPath, 'apps', 'api'),
    'exec zsh -i',
  ])
  await hold(900)
  runTmux([
    'send-keys',
    '-t',
    'Studio',
    `nvim -u ${nvimConfigPath} -i NONE -n README.md`,
    'Enter',
  ])
  runTmux(['send-keys', '-t', 'Relay', 'git log --oneline -3', 'Enter'])
  runTmux([
    'send-keys',
    '-t',
    'Lumen~~main~~apps/api',
    `nvim -u ${nvimConfigPath} -i NONE -n src/index.ts`,
    'Enter',
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
    waitFor('Atlas')
    mark('start')
    await hold(1_050)
    mark('before-open-end')

    openHarbr()
    waitFor('Filter active sessions')
    await hold(450)
    for (let step = 0; step < 6; step++) {
      send('up')
      await hold(170)
    }
    mark('active-ready')
    await hold(550)

    for (let step = 0; step < 3; step++) {
      send('down')
      await hold(500)
    }
    send('enter')
    waitFor('README.md')
    await hold(1_300)
    mark('studio-end')

    openHarbr()
    waitFor('Filter active sessions')
    await hold(450)
    send('tab')
    waitFor('Filter projects')
    await hold(550)
    for (let step = 0; step < 8; step++) {
      send('up')
      await hold(170)
    }
    mark('browse-ready')
    await hold(500)

    for (let step = 0; step < 3; step++) {
      send('down')
      await hold(500)
      mark(`browse-step-${step + 1}`)
    }
    send('enter')
    waitFor('Filter workspaces')
    await hold(700)

    send('down')
    await hold(650)
    send('enter')
    waitFor('Filter modules')
    await hold(500)
    mark('modules')
    await hold(1_250)
    mark('modules-end')

    send('text:?')
    waitFor('Keyboard Help')
    await hold(500)
    mark('help')
    await hold(2_150)
    send('escape')
    await hold(750)
    mark('help-end')

    send('ctrl-a')
    waitFor('Create module windows')
    await hold(750)
    send('down')
    await hold(600)
    send('enter')
    waitFor('2 panes')
    await hold(650)
    mark('layout')
    await hold(1_650)

    send('enter')
    await hold(950)
    if (agentCommand) {
      runTmux(['select-window', '-t', '=Lumen~~lumen-launch~~apps/api:Agent'])
      await hold(1_800)
    }
    runTmux(['select-window', '-t', '=Lumen~~lumen-launch~~apps/api:Run'])
    runTmux([
      'send-keys',
      '-t',
      '=Lumen~~lumen-launch~~apps/api:Run.0',
      `nvim -u ${nvimConfigPath} -i NONE -n src/index.ts`,
      'Enter',
    ])
    runTmux([
      'send-keys',
      '-t',
      '=Lumen~~lumen-launch~~apps/api:Run.1',
      'git status -sb',
      'Enter',
    ])
    await hold(1_600)
    mark('created')
    await hold(650)
    mark('end')

    runTmux(['switch-client', '-t', 'Atlas'])
    await hold(450)
    openHarbr()
    waitFor('Filter active sessions')
    await hold(550)
    mark('mouse-ready')
    await hold(500)
    mouse('click', 37, 10)
    waitFor('Filter projects')
    await hold(750)
    mouse('move', 35, 17)
    await hold(650)
    mouse('move', 35, 26)
    await hold(650)
    mouse('click', 35, 26)
    waitFor('Filter workspaces')
    await hold(1_300)
    mark('mouse-end')
  } finally {
    run(termctrl, ['stop', sessionName], repoRoot, { allowFailure: true })
  }

  const features = [
    {
      file: '01-switch-live-sessions.mp4',
      clips: [
        { from: 'start', to: 'before-open-end' },
        { from: 'active-ready', to: 'studio-end' },
      ],
    },
    {
      file: '02-find-repos-and-packages.mp4',
      clips: [{ from: 'browse-ready', to: 'modules-end' }],
    },
    {
      file: '03-keyboard-help.mp4',
      clips: [{ from: 'modules-end', to: 'help-end' }],
    },
    {
      file: '04-create-a-layout.mp4',
      clips: [{ from: 'help-end', to: 'end' }],
    },
    {
      file: '05-mouse-support-if-you-really-need-it.mp4',
      clips: [{ from: 'mouse-ready', to: 'mouse-end' }],
    },
  ]
  for (const file of await readdir(clipsPath)) {
    if (/^(?:0[1-9]|[1-8]\d)-.*\.mp4$/.test(file)) {
      await rm(path.join(clipsPath, file))
    }
  }
  for (const feature of features) {
    const editPath = path.join(outputRoot, `${feature.file}.json`)
    await writeFile(editPath, JSON.stringify({ clips: feature.clips }, null, 2))
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
      '100',
      '--out',
      path.join(clipsPath, feature.file),
    ])
  }
  for (const marker of [
    'active-ready',
    'browse-ready',
    'layout',
    'created',
    'mouse-end',
  ]) {
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
  console.log(`Numbered clips: ${clipsPath}`)
  console.log(`Recording and review frames: ${outputRoot}`)
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
  run('git', [
    '-C',
    lumenPath,
    'worktree',
    'add',
    '-b',
    'feature/api',
    lumenWorktreePath,
  ])
  await createRepo(relayPath, [])
  await createRepo(beaconPath, [])
  await createRepo(docsPath, [])

  await writeFile(
    path.join(zdotDir, '.zshrc'),
    [
      '# Isolated demo shell: use the host Starship theme without loading plugins or credentials.',
      'if command -v starship >/dev/null 2>&1; then',
      '  eval "$(starship init zsh)"',
      'fi',
      '',
    ].join('\n'),
  )
  const starshipConfig = path.join(
    process.env.HOME ?? '',
    '.config',
    'starship.toml',
  )
  if (process.env.STARSHIP_CONFIG) {
    environment.STARSHIP_CONFIG = process.env.STARSHIP_CONFIG
  } else if (await Bun.file(starshipConfig).exists()) {
    environment.STARSHIP_CONFIG = starshipConfig
  }
  const catppuccinPath = path.join(
    process.env.HOME ?? '',
    '.local',
    'share',
    'nvim',
    'lazy',
    'catppuccin',
  )
  await writeFile(
    nvimConfigPath,
    [
      'vim.opt.termguicolors = true',
      'vim.opt.number = true',
      'vim.opt.relativenumber = true',
      'vim.opt.laststatus = 3',
      'vim.opt.statusline = " %f %m %= %y  %l:%c "',
      `vim.opt.runtimepath:append(${JSON.stringify(catppuccinPath)})`,
      "if pcall(require, 'catppuccin') then",
      "  require('catppuccin').setup({ flavour = 'mocha', integrations = {} })",
      "  vim.cmd.colorscheme('catppuccin')",
      'else',
      "  vim.cmd.colorscheme('habamax')",
      'end',
      'vim.cmd.syntax("on")',
      '',
    ].join('\n'),
  )

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
            {
              name: 'Agent',
              panes: [
                {
                  name: 'OpenCode',
                  ...(agentCommand ? { command: agentCommand } : {}),
                },
              ],
            },
            { name: 'Run', panes: [{ name: 'Server' }, { name: 'Shell' }] },
          ],
        },
        { name: 'Studio', repo: studioPath },
        {
          name: 'Lumen',
          repo: lumenPath,
          modules: ['apps/api', 'packages/ui'],
          windows: [
            {
              name: 'Agent',
              panes: [
                {
                  name: 'OpenCode',
                  ...(agentCommand ? { command: agentCommand } : {}),
                },
              ],
            },
            { name: 'Run', panes: [{ name: 'Server' }, { name: 'Shell' }] },
          ],
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
      'set -g default-terminal "screen-256color"',
      'set -g status-position top',
      'set -g status-style "bg=#1e1e2e,fg=#cdd6f4"',
      'set -g status-left "#[bg=#89b4fa,fg=#1e1e2e,bold] #S #[bg=#1e1e2e,fg=#89b4fa]"',
      'set -g status-left-length 60',
      'set -g status-right "#[fg=#a6adc8]#(date +%H:%M) #[bg=#cba6f7,fg=#1e1e2e,bold] DEV "',
      'set -g window-status-format " #[fg=#6c7086]#I:#W "',
      'set -g window-status-current-format " #[bg=#313244,fg=#cdd6f4,bold]#I:#W "',
      'set -g default-shell /bin/zsh',
      'set -g default-command "exec zsh -i"',
      'set -g mouse on',
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
    await writeFile(
      path.join(modulePath, 'src', 'index.ts'),
      [
        `// ${module} — ${path.basename(repoPath)} workspace`,
        '',
        'type Session = {',
        '  id: string',
        '  project: string',
        '  branch: string',
        '}',
        '',
        'export function openSession(session: Session) {',
        '  const label = `${session.project} / ${session.branch}`',
        '  return { ...session, label, active: true }',
        '}',
        '',
      ].join('\n'),
    )
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

function mouse(action: 'move' | 'click', column: number, row: number) {
  run(termctrl, ['mouse', sessionName, action, String(column), String(row)])
}

function mark(name: string) {
  run(termctrl, ['mark', sessionName, name])
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
