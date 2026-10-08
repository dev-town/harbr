#!/usr/bin/env bun

import { execFileSync } from 'node:child_process'
import { chmod, copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout } from 'node:timers/promises'

import ffmpeg from '@ffmpeg-installer/ffmpeg'
import { resolveTerminalControlBinary } from '@kitlangton/terminal-control'

const repoRoot = path.resolve(import.meta.dirname, '../../..')
const appRoot = path.resolve(import.meta.dirname, '..')
const outputRoot = path.resolve(
  process.argv[2] ?? path.join(repoRoot, '.artifacts', 'terminal-control', 'walkthrough'),
)
const recordingPath = path.join(outputRoot, 'walkthrough.termctrl')
const clipsPath = path.join(outputRoot, 'clips')
const fixtureRoot = await mkdtemp('/tmp/hw-')
const runtimeDir = path.join(fixtureRoot, 'runtime')
const zdotDir = path.join(fixtureRoot, 'zdot')
const tmuxSocketPath = path.join(fixtureRoot, 'tmux.sock')
const tmuxConfigPath = path.join(fixtureRoot, 'tmux.conf')
const popupScriptPath = path.join(fixtureRoot, 'open-harbr.sh')
const appScriptPath = path.join(fixtureRoot, 'open-demo-app.sh')
const attachScriptPath = path.join(fixtureRoot, 'attach-tmux.sh')
const terminalPalettePath = path.join(fixtureRoot, 'terminal-palette.ansi')
const lazygitConfigPath = path.join(fixtureRoot, 'lazygit-config.yml')
const nvimConfigPath = path.join(fixtureRoot, 'nvim.lua')
const configPath = path.join(fixtureRoot, 'config.json')
const dbPath = path.join(fixtureRoot, 'harbr.sqlite')
const atlasPath = path.join(fixtureRoot, 'atlas')
const atlasWorktreePath = path.join(fixtureRoot, 'atlas-launch')
const studioPath = path.join(fixtureRoot, 'studio')
const herdrPath = path.join(fixtureRoot, 'herdr')
const herdrWorktreePath = path.join(fixtureRoot, 'herdr-workspace')
const lumenPath = path.join(fixtureRoot, 'lumen')
const lumenWorktreePath = path.join(fixtureRoot, 'lumen-launch')
const relayPath = path.join(fixtureRoot, 'relay')
const beaconPath = path.join(fixtureRoot, 'beacon')
const docsPath = path.join(fixtureRoot, 'docs')
const sessionName = `harbr-walkthrough-${process.pid}`
const termctrl = resolveTerminalControlBinary()
const demoAppCommand =
  process.env.HARBR_DEMO_APP_COMMAND?.trim() ?? process.env.HARBR_DEMO_AGENT_COMMAND?.trim()
const isLazygitDemo = path.basename(demoAppCommand?.split(/\s+/)[0] ?? '') === 'lazygit'
const lazygitSourceConfigPath = path.resolve(
  process.env.HARBR_DEMO_LAZYGIT_CONFIG ??
    path.join(process.env.HOME ?? '', '.config', 'lazygit', 'config.yml'),
)
const ghosttyThemePath = path.resolve(
  process.env.HARBR_DEMO_GHOSTTY_THEME ??
    path.join(process.env.HOME ?? '', '.config', 'ghostty', 'ghostty-theme'),
)
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
  const terminalTheme = await setupFixture()
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
  runTmux(['new-session', '-d', '-s', 'Studio', '-c', studioPath, 'exec zsh -i'])
  await hold(900)
  runTmux([
    'send-keys',
    '-t',
    'Studio',
    `nvim -u ${nvimConfigPath} -i NONE -n src/session.ts`,
    'Enter',
  ])
  await hold(2_500)

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
    '/bin/sh',
    attachScriptPath,
  ])

  try {
    if (terminalTheme) {
      const statePath = path.join(fixtureRoot, 'terminal-state.json')
      run(termctrl, ['save', sessionName, '--format', 'json', '--out', statePath])
      const state = JSON.parse(await readFile(statePath, 'utf8')) as {
        foreground: { r: number; g: number; b: number }
        background: { r: number; g: number; b: number }
      }
      for (const key of ['foreground', 'background'] as const) {
        const actual = Object.values(state[key])
          .map((channel) => channel.toString(16).padStart(2, '0'))
          .join('')
        if (actual !== terminalTheme[key]) {
          throw new Error(
            `Terminal ${key} is #${actual}, expected #${terminalTheme[key]} from ${ghosttyThemePath}`,
          )
        }
      }
    }

    waitFor('Atlas')
    if (demoAppCommand) {
      runTmux(['send-keys', '-t', 'Atlas', `clear; ${appScriptPath}`, 'Enter'])
      await hold(1_500)
      runTmux([
        'rename-window',
        '-t',
        'Atlas:0',
        path.basename(demoAppCommand.split(' ')[0] ?? 'app'),
      ])
    }
    mark('start')
    await hold(1_050)
    mark('before-open-end')

    openHarbr()
    waitFor('Filter active sessions')
    await hold(450)
    mark('active-ready')
    await hold(850)
    send('down')
    await hold(850)
    send('enter')
    await hold(1_700)
    mark('active-end')

    await hold(1_000)
    openHarbr()
    waitFor('Filter active sessions')
    await hold(850)
    send('tab')
    waitFor('Filter projects')
    await hold(700)
    for (let step = 0; step < 8; step++) {
      send('up')
      await hold(100)
    }
    await hold(650)

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
    await hold(850)
    send('down')
    await hold(550)
    send('down')
    await hold(550)
    send('up')
    await hold(500)
    send('up')
    await hold(500)
    mark('modules')
    await hold(1_500)
    mark('modules-end')

    await hold(1_000)
    send('ctrl-a')
    waitFor('Create module windows')
    await hold(750)
    send('down')
    await hold(550)
    send('enter')
    waitFor('Space toggle')
    await hold(850)
    mark('layout')
    for (let step = 0; step < 3; step++) {
      send('down')
      await hold(560)
    }
    await hold(1_350)
    send('escape')
    await hold(1_100)
    mark('layout-end')

    await hold(900)
    send('text:?')
    waitFor('Keyboard Help')
    await hold(1_100)
    mark('help-before-scroll')
    for (let step = 0; step < 52; step++) {
      send('down')
      await hold(115)
    }
    mark('help-after-scroll')
    await hold(1_600)
    mark('end')
  } finally {
    run(termctrl, ['stop', sessionName], repoRoot, { allowFailure: true })
  }

  const features = [
    {
      file: '01-switch-live-sessions.mp4',
      clips: [
        { from: 'start', to: 'before-open-end' },
        { from: 'active-ready', to: 'active-end' },
      ],
    },
    {
      file: '02-find-repos-and-packages.mp4',
      clips: [{ from: 'active-end', to: 'modules-end' }],
    },
    {
      file: '03-configured-layouts.mp4',
      clips: [{ from: 'modules-end', to: 'layout-end' }],
    },
    {
      file: '04-keyboard-help.mp4',
      clips: [{ from: 'layout-end', to: 'end' }],
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
    'active-end',
    'modules',
    'layout',
    'help-before-scroll',
    'help-after-scroll',
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
  const terminalTheme = (await Bun.file(ghosttyThemePath).exists())
    ? parseGhosttyTheme(await readFile(ghosttyThemePath, 'utf8'))
    : undefined
  if (!terminalTheme && process.env.HARBR_DEMO_GHOSTTY_THEME) {
    throw new Error(`Ghostty theme not found: ${ghosttyThemePath}`)
  }
  if (terminalTheme) {
    await writeFile(terminalPalettePath, terminalTheme.ansi)
    console.log(`Terminal palette: ${ghosttyThemePath}`)
  }
  await writeFile(
    attachScriptPath,
    [
      '#!/bin/sh',
      ...(terminalTheme ? [`cat "${terminalPalettePath}"`] : []),
      `exec tmux -S "${tmuxSocketPath}" attach-session -t Atlas`,
      '',
    ].join('\n'),
  )
  await createRepo(atlasPath, ['apps/web', 'packages/core'])
  run('git', ['-C', atlasPath, 'worktree', 'add', '-b', 'feature/launch', atlasWorktreePath])
  await writeFile(
    path.join(atlasPath, 'apps', 'web', 'src', 'index.ts'),
    [
      'export function openWorkspace(project: string, branch: string) {',
      '  return {',
      '    project,',
      '    branch,',
      '    status: "ready",',
      '    openedAt: new Date().toISOString(),',
      '  }',
      '}',
      '',
    ].join('\n'),
  )
  await createRepo(studioPath, [])
  await mkdir(path.join(studioPath, 'src'), { recursive: true })
  await writeFile(
    path.join(studioPath, 'src', 'session.ts'),
    [
      'export type DevSession = {',
      '  project: string',
      '  branch: string',
      '  editor: "nvim" | "opencode"',
      '  active: boolean',
      '}',
      '',
      'export function switchSession(',
      '  sessions: DevSession[],',
      '  nextProject: string,',
      '): DevSession[] {',
      '  return sessions.map((session) => ({',
      '    ...session,',
      '    active: session.project === nextProject,',
      '  }))',
      '}',
      '',
      'const sessions: DevSession[] = [',
      '  { project: "Atlas", branch: "main", editor: "opencode", active: false },',
      '  { project: "Studio", branch: "main", editor: "nvim", active: true },',
      ']',
      '',
      'switchSession(sessions, "Studio")',
      '',
    ].join('\n'),
  )
  run('git', ['-C', studioPath, 'add', '.'])
  run('git', [
    '-C',
    studioPath,
    '-c',
    'user.name=Harbr Demo',
    '-c',
    'user.email=demo@example.invalid',
    'commit',
    '-m',
    'Add session navigation example',
  ])
  await createHerdrRepo()
  run('git', ['-C', herdrPath, 'worktree', 'add', '-b', 'feature/workspace', herdrWorktreePath])
  await createRepo(lumenPath, ['apps/api', 'packages/ui'])
  run('git', ['-C', lumenPath, 'worktree', 'add', '-b', 'feature/api', lumenWorktreePath])
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
  const starshipConfig = path.join(process.env.HOME ?? '', '.config', 'starship.toml')
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
      theme: 'catppuccin',
      projects: [
        {
          name: 'Atlas',
          repo: atlasPath,
          modules: ['apps/web', 'packages/core'],
        },
        { name: 'Studio', repo: studioPath },
        {
          name: 'Herdr',
          repo: herdrPath,
          modules: ['src', 'crates/ghostty-vt', 'docs/next', 'skills/herdr'],
          windows: [
            { name: 'OpenCode', panes: [{ name: 'OpenCode' }] },
            {
              name: 'Editor + Tests',
              panes: [{ name: 'Neovim' }, { name: 'Tests' }],
            },
            {
              name: 'Server + Logs',
              panes: [{ name: 'Server' }, { name: 'Logs' }],
            },
            { name: 'Review', panes: [{ name: 'Diff' }, { name: 'Shell' }] },
          ],
        },
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
  if (isLazygitDemo) {
    if (!(await Bun.file(lazygitSourceConfigPath).exists())) {
      throw new Error(`LazyGit config not found: ${lazygitSourceConfigPath}`)
    }
    await copyFile(lazygitSourceConfigPath, lazygitConfigPath)
  }
  if (demoAppCommand) {
    await writeFile(
      appScriptPath,
      [
        '#!/bin/sh',
        `export XDG_DATA_HOME="${path.join(fixtureRoot, 'xdg-data')}"`,
        `export XDG_CONFIG_HOME="${path.join(fixtureRoot, 'xdg-config')}"`,
        `export XDG_CACHE_HOME="${path.join(fixtureRoot, 'xdg-cache')}"`,
        'export OPENCODE_DISABLE_AUTOUPDATE=1',
        `exec ${demoAppCommand}${isLazygitDemo ? ` --use-config-file "${lazygitConfigPath}"` : ''}`,
        '',
      ].join('\n'),
    )
    await chmod(appScriptPath, 0o700)
  }
  await writeFile(
    tmuxConfigPath,
    [
      'set -g prefix C-s',
      'unbind C-b',
      'set -g default-terminal "screen-256color"',
      'set -g status-position top',
      'set -g status-style "bg=#141311,fg=#F9F7F3"',
      'set -g status-left "#[bg=#C89D65,fg=#111111,bold] ● ACTIVE  #S #[bg=#141311,fg=#C89D65]"',
      'set -g status-left-length 60',
      'set -g status-right "#[fg=#6F6862]#(date +%H:%M) #[bg=#F9F7F3,fg=#111111,bold] DEV "',
      'set -g window-status-format " #[fg=#6F6862]#I:#W "',
      'set -g window-status-current-format " #[bg=#38332e,fg=#F9F7F3,bold]#I:#W "',
      'set -g default-shell /bin/zsh',
      'set -g default-command "exec zsh -i"',
      'set -g mouse on',
      'set -g pane-border-lines double',
      `bind-key -r s display-popup -B -E -d "#{pane_current_path}" -w 80% -h 60% -x C -y C "${popupScriptPath}"`,
      '',
    ].join('\n'),
  )
  return terminalTheme
}

function parseGhosttyTheme(theme: string) {
  function color(key: string) {
    const value = theme.match(new RegExp(`^\\s*${key}\\s*=\\s*#?([0-9a-fA-F]{6})\\s*$`, 'm'))?.[1]
    if (!value) throw new Error(`Ghostty theme is missing ${key}`)
    return value.toLowerCase()
  }

  const foreground = color('foreground')
  const background = color('background')
  const palette = new Map(
    [...theme.matchAll(/^\s*palette\s*=\s*(\d{1,2})\s*=\s*#?([0-9a-fA-F]{6})\s*$/gm)].map(
      ([, index, hex]) => [Number(index), hex.toLowerCase()],
    ),
  )
  const osc = (code: number | string, hex: string) =>
    `\x1b]${code};rgb:${hex.slice(0, 2)}/${hex.slice(2, 4)}/${hex.slice(4)}\x07`
  const ansi = [osc(10, foreground), osc(11, background)]
  for (let index = 0; index < 16; index++) {
    const hex = palette.get(index)
    if (!hex) throw new Error(`Ghostty theme is missing palette ${index}`)
    ansi.push(osc(`4;${index}`, hex))
  }
  return { foreground, background, ansi: ansi.join('') }
}

async function createHerdrRepo() {
  await mkdir(path.join(herdrPath, 'src'), { recursive: true })
  await mkdir(path.join(herdrPath, 'crates', 'ghostty-vt', 'src'), {
    recursive: true,
  })
  await mkdir(path.join(herdrPath, 'docs', 'next'), { recursive: true })
  await mkdir(path.join(herdrPath, 'skills', 'herdr'), { recursive: true })
  await writeFile(path.join(herdrPath, 'README.md'), '# Herdr\n')
  await writeFile(
    path.join(herdrPath, 'Cargo.toml'),
    '[package]\nname = "herdr"\nversion = "0.1.0"\n\n[workspace]\nmembers = ["crates/ghostty-vt"]\n',
  )
  await writeFile(path.join(herdrPath, 'src', 'main.rs'), 'fn main() {}\n')
  await writeFile(
    path.join(herdrPath, 'crates', 'ghostty-vt', 'Cargo.toml'),
    '[package]\nname = "ghostty-vt"\nversion = "0.1.0"\n',
  )
  await writeFile(
    path.join(herdrPath, 'crates', 'ghostty-vt', 'src', 'lib.rs'),
    'pub fn parse() {}\n',
  )
  await writeFile(path.join(herdrPath, 'docs', 'next', 'README.md'), '# Docs\n')
  await writeFile(path.join(herdrPath, 'skills', 'herdr', 'README.md'), '# Herdr skill\n')
  run('git', ['init', '-b', 'main', herdrPath])
  run('git', ['-C', herdrPath, 'add', '.'])
  run('git', [
    '-C',
    herdrPath,
    '-c',
    'user.name=Harbr Demo',
    '-c',
    'user.email=demo@example.invalid',
    'commit',
    '-m',
    'Create Herdr workspace fixture',
  ])
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
