#!/usr/bin/env bun

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { TerminalControl, type Session } from '@kitlangton/terminal-control'

const repoRoot = path.resolve(import.meta.dirname, '../../..')
const appRoot = path.resolve(import.meta.dirname, '..')
const fixtureRoot = await mkdtemp('/tmp/ht-')
const atlasPath = path.join(fixtureRoot, 'atlas')
const atlasWorktreePath = path.join(fixtureRoot, 'atlas-launch')
const studioPath = path.join(fixtureRoot, 'studio')
const configPath = path.join(fixtureRoot, 'config.json')
const dbPath = path.join(fixtureRoot, 'harbr.sqlite')
const tmuxConfigPath = path.join(fixtureRoot, 'tmux.conf')
const tmuxSocketPath = path.join(fixtureRoot, 'tmux.sock')
const runtimeDir = path.join(fixtureRoot, 'runtime')
const popupScriptPath = path.join(fixtureRoot, 'open-harbr.sh')
const artifactsRoot = path.join(
  repoRoot,
  '.artifacts',
  'terminal-control',
  'e2e',
)
const shellEnvironment = { ...process.env }

delete shellEnvironment.TMUX
delete shellEnvironment.HERDR_SOCKET_PATH
delete shellEnvironment.HERDR_WORKSPACE_ID
delete shellEnvironment.HERDR_PANE_ID

try {
  await setupFixture()

  await using terminal = await TerminalControl.make({
    cwd: repoRoot,
    env: {
      TERMCTRL_RUNTIME_DIR: runtimeDir,
      TMUX: undefined,
      HERDR_SOCKET_PATH: undefined,
      HERDR_WORKSPACE_ID: undefined,
      HERDR_PANE_ID: undefined,
    },
    artifacts: {
      directory: artifactsRoot,
      onFailure: true,
      includeTranscript: false,
      includeRecording: true,
    },
  })

  await activeSessionSwitchesThroughPopup(terminal)
  await browseActionsAndHelpWorkThroughPopup(terminal)
  await configuredWindowsCreateRealTmuxLayout(terminal)
  await activeModuleSessionIsSearchable(terminal)

  console.log('Harbr terminal-control E2E passed: 4 popup flows')
} finally {
  runTmux(['kill-server'], { allowFailure: true })
  await rm(fixtureRoot, { force: true, recursive: true })
}

async function setupFixture() {
  await mkdir(runtimeDir, { recursive: true })
  await chmod(runtimeDir, 0o700)
  await mkdir(path.join(atlasPath, 'apps', 'web'), { recursive: true })
  await mkdir(path.join(atlasPath, 'packages', 'core'), { recursive: true })
  await writeFile(path.join(atlasPath, 'README.md'), '# Atlas\n')
  await writeFile(path.join(atlasPath, 'apps', 'web', 'README.md'), '# Web\n')
  await writeFile(
    path.join(atlasPath, 'packages', 'core', 'README.md'),
    '# Core\n',
  )
  run('git', ['init', '-b', 'main', atlasPath])
  run('git', ['-C', atlasPath, 'add', '.'])
  run('git', [
    '-C',
    atlasPath,
    '-c',
    'user.name=Harbr E2E',
    '-c',
    'user.email=e2e@example.invalid',
    'commit',
    '-m',
    'Create Atlas',
  ])
  run('git', [
    '-C',
    atlasPath,
    'worktree',
    'add',
    '-b',
    'feature/launch',
    atlasWorktreePath,
  ])

  await mkdir(studioPath, { recursive: true })
  await writeFile(path.join(studioPath, 'README.md'), '# Studio\n')
  run('git', ['init', '-b', 'main', studioPath])
  run('git', ['-C', studioPath, 'add', '.'])
  run('git', [
    '-C',
    studioPath,
    '-c',
    'user.name=Harbr E2E',
    '-c',
    'user.email=e2e@example.invalid',
    'commit',
    '-m',
    'Create Studio',
  ])

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
            {
              name: 'Run',
              panes: [{ name: 'Server' }, { name: 'Shell' }],
            },
          ],
        },
        { name: 'Studio', repo: studioPath },
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
      'set -g default-shell /bin/sh',
      'set -g default-command /bin/sh',
      'set -g mouse off',
      'set -g detach-on-destroy off',
      `bind-key -r s display-popup -B -E -d "#{pane_current_path}" -w 80% -h 60% -x C -y C "${popupScriptPath}"`,
      '',
    ].join('\n'),
  )

  runTmux([
    '-f',
    tmuxConfigPath,
    'new-session',
    '-d',
    '-s',
    'Atlas',
    '-c',
    atlasPath,
    "printf 'ATLAS SESSION\\n'; exec sleep 600",
  ])
  runTmux([
    'new-session',
    '-d',
    '-s',
    'Studio',
    '-c',
    studioPath,
    "printf 'STUDIO SESSION\\n'; exec sleep 600",
  ])
}

async function activeSessionSwitchesThroughPopup(terminal: TerminalControl) {
  await using client = await attachClient(terminal, 'Atlas')

  await client.withArtifactsOnFailure('active-switch', async () => {
    await client.screen.waitForText('ATLAS SESSION')
    await openHarbr(client)
    const active = await client.screen.text()
    assert.match(active, /Atlas/)
    assert.match(active, /Studio/)

    await client.keyboard.press('ArrowDown')
    await client.screen.text()
    await client.keyboard.press('Enter')
    await client.screen.waitUntil(
      (screen) =>
        screen.text.includes('STUDIO SESSION') &&
        !screen.text.includes('Filter active sessions'),
      { timeoutMs: 15_000 },
    )
    assert.equal(currentClientSession(), 'Studio')
  })

  console.log('✓ Active switches between real tmux sessions')
}

async function browseActionsAndHelpWorkThroughPopup(terminal: TerminalControl) {
  await using client = await attachClient(terminal, 'Studio')

  await client.withArtifactsOnFailure('browse-and-help', async () => {
    await client.screen.waitForText('STUDIO SESSION')
    await openHarbr(client)
    await selectAtlasProject(client)

    await client.keyboard.press('Enter')
    await client.screen.waitForText('Filter workspaces')
    assert.match(await client.screen.text(), /atlas-launch/)

    await client.keyboard.press('ArrowDown')
    await client.screen.text()
    await client.keyboard.press('Enter')
    await client.screen.waitForText('Filter modules')
    const modules = await client.screen.text()
    assert.match(modules, /apps\/web/)
    assert.match(modules, /packages\/core/)

    await client.keyboard.type('?')
    await client.screen.waitForText('Keyboard Help')
    await client.keyboard.press('Escape')
    await client.screen.waitUntil(
      (screen) =>
        screen.text.includes('Filter modules') &&
        !screen.text.includes('Keyboard Help'),
      { timeoutMs: 10_000 },
    )

    await client.keyboard.press('Control+A')
    await client.screen.waitForText('Create module windows')
    await client.screen.text()
    await client.keyboard.press('ArrowDown')
    await client.screen.text()
    await client.keyboard.press('Enter')
    await client.screen.waitForText('2 panes')
    const picker = await client.screen.text()
    assert.match(picker, /Agent/)
    assert.match(picker, /Run/)

    await client.keyboard.press('Escape')
    await client.screen.waitUntil(
      (screen) =>
        screen.text.includes('Actions') && !screen.text.includes('2 panes'),
      { timeoutMs: 10_000 },
    )
    await client.screen.text()
    await client.keyboard.press('Escape')
    await client.screen.waitUntil(
      (screen) => !screen.text.includes('Start module'),
      { timeoutMs: 10_000 },
    )
    await client.screen.text()
    await client.keyboard.press('Control+C')
    await client.screen.waitUntil(
      (screen) => !screen.text.includes('Filter modules'),
      { timeoutMs: 10_000 },
    )
    assert.equal(currentClientSession(), 'Studio')
  })

  console.log('✓ Browse, Help, action menu, and layout picker work in popup')
}

async function configuredWindowsCreateRealTmuxLayout(
  terminal: TerminalControl,
) {
  await using client = await attachClient(terminal, 'Studio')

  await client.withArtifactsOnFailure('create-windows', async () => {
    await client.screen.waitForText('STUDIO SESSION')
    await openHarbr(client)
    await selectAtlasProject(client)
    await client.keyboard.press('Enter')
    await client.screen.waitForText('Filter workspaces')
    await client.screen.text()
    await client.keyboard.press('ArrowDown')
    await client.screen.text()
    await client.keyboard.press('Enter')
    await client.screen.waitForText('Filter modules')
    await client.screen.text()
    await client.keyboard.press('Control+A')
    await client.screen.waitForText('Create module windows')
    await client.screen.text()
    await client.keyboard.press('ArrowDown')
    await client.screen.text()
    await client.keyboard.press('Enter')
    await client.screen.waitForText('2 panes')
    await client.keyboard.press('Enter')
    await client.screen.waitUntil(
      (screen) => !screen.text.includes('Filter modules'),
      { timeoutMs: 15_000 },
    )

    const createdSession = 'Atlas~~atlas-launch~~apps/web'
    assert.equal(currentClientSession(), createdSession)
    assert.deepEqual(
      runTmux([
        'list-windows',
        '-t',
        `=${createdSession}`,
        '-F',
        '#{window_name}',
      ])
        .trim()
        .split('\n'),
      ['Agent', 'Run'],
    )
    assert.deepEqual(
      runTmux([
        'list-panes',
        '-t',
        `=${createdSession}:Run`,
        '-F',
        '#{pane_title}',
      ])
        .trim()
        .split('\n'),
      ['Server', 'Shell'],
    )
  })

  console.log('✓ Configured windows create the named one- and two-pane layout')
}

async function activeModuleSessionIsSearchable(terminal: TerminalControl) {
  await using client = await attachClient(terminal, 'Studio')

  await client.withArtifactsOnFailure('active-module-switch', async () => {
    await client.screen.waitForText('STUDIO SESSION')
    await openHarbr(client)
    await client.keyboard.type('apps/web')
    await client.screen.waitUntil(
      (screen) => /│ apps\/web\s+│/.test(screen.text),
      { timeoutMs: 10_000 },
    )
    await client.screen.text()
    await client.keyboard.press('Enter')
    await client.screen.waitUntil(
      (screen) => !screen.text.includes('Filter active sessions'),
      { timeoutMs: 15_000 },
    )
    assert.equal(currentClientSession(), 'Atlas~~atlas-launch~~apps/web')
  })

  console.log('✓ Active finds and switches to a monorepo module session')
}

async function attachClient(terminal: TerminalControl, sessionName: string) {
  return terminal.launch({
    command: [
      'tmux',
      '-S',
      tmuxSocketPath,
      'attach-session',
      '-t',
      sessionName,
    ],
    host: 'opentui',
    viewport: { cols: 140, rows: 44 },
    record: 'on-failure',
  })
}

async function openHarbr(client: Session) {
  await client.keyboard.press('Control+S')
  await client.keyboard.type('s')
  await client.screen.waitForText('Filter active sessions', {
    timeoutMs: 15_000,
  })
  const active = await client.screen.text()
  assert.match(active, /Atlas/)
  assert.match(active, /Studio/)
}

async function selectAtlasProject(client: Session) {
  await client.keyboard.press('Tab')
  await client.screen.waitForText('Filter projects')
  const projects = await client.screen.text()
  assert.match(projects, /Atlas/)
  assert.match(projects, /Studio/)
  await client.keyboard.type('Atlas')
  await client.screen.waitUntil((screen) => /│ Atlas\s+│/.test(screen.text), {
    timeoutMs: 10_000,
  })
  assert.match(await client.screen.text(), /│ Atlas\s+│/)
}

function currentClientSession() {
  return runTmux(['list-clients', '-F', '#{client_session}']).trim()
}

function runTmux(
  args: string[],
  options: { allowFailure?: boolean } = {},
): string {
  return run('tmux', ['-S', tmuxSocketPath, ...args], options)
}

function run(
  command: string,
  args: string[],
  options: { allowFailure?: boolean } = {},
) {
  try {
    return execFileSync(command, args, {
      cwd: repoRoot,
      encoding: 'utf8',
      env: shellEnvironment,
      timeout: 20_000,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (error) {
    if (options.allowFailure) return ''
    const details = error as Error & { stderr?: string }
    throw new Error(
      `${command} ${args.join(' ')} failed: ${details.stderr?.trim() || details.message}`,
      { cause: error },
    )
  }
}
