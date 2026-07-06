#!/usr/bin/env bun

import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

import { themeIds, type ThemeId } from '../src/config/theme'

type CommandResult = {
  stderr: string
  stdout: string
  status: number | null
}

const repoRoot = path.resolve(import.meta.dirname, '../../..')
const appRoot = path.resolve(import.meta.dirname, '..')
const artifactsRoot = path.join(repoRoot, '.artifacts', 'agent-tty', 'themes')
const expectedText = ['Active', 'Browse', 'Help']

await assertAgentTtyAvailable()
await rm(artifactsRoot, { force: true, recursive: true })
await mkdir(artifactsRoot, { recursive: true })

const failures: string[] = []

for (const themeId of themeIds) {
  try {
    await validateTheme(themeId)
  } catch (error) {
    failures.push(
      `${themeId}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

if (failures.length > 0) {
  console.error('TUI theme E2E failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(`Validated ${themeIds.length} TUI themes with agent-tty.`)
console.log(`Artifacts: ${artifactsRoot}`)

async function validateTheme(themeId: ThemeId) {
  const themeRoot = path.join(artifactsRoot, themeId)
  const homePath = path.join(themeRoot, 'agent-tty-home')
  const configPath = path.join(themeRoot, 'harbr.config.json')
  const dbPath = path.join(themeRoot, 'harbr.sqlite')
  let sessionId: string | null = null

  await mkdir(themeRoot, { recursive: true })
  await writeFile(
    configPath,
    JSON.stringify({ theme: themeId, projects: [] }, null, 2),
    'utf8',
  )

  try {
    sessionId = getSessionId(
      runAgentTty(homePath, ['create', '--json', '--', '/bin/bash']),
    )

    runAgentTty(homePath, [
      'resize',
      sessionId,
      '--cols',
      '120',
      '--rows',
      '36',
      '--json',
    ])

    runAgentTty(homePath, [
      'run',
      sessionId,
      [
        `cd ${shellQuote(appRoot)}`,
        `bun src/index.tsx --path ${shellQuote(configPath)} --db-path ${shellQuote(dbPath)}`,
      ].join(' && '),
      '--no-wait',
      '--json',
    ])

    runAgentTty(homePath, [
      'wait',
      sessionId,
      '--screen-stable-ms',
      '1000',
      '--timeout',
      '10000',
      '--json',
    ])

    const snapshotResult = runAgentTty(homePath, [
      'snapshot',
      sessionId,
      '--format',
      'text',
      '--json',
    ])
    const snapshotText = getTextPayload(snapshotResult.stdout)

    await writeFile(path.join(themeRoot, 'snapshot.txt'), snapshotText, 'utf8')
    await writeFile(
      path.join(themeRoot, 'snapshot.json'),
      snapshotResult.stdout,
      'utf8',
    )

    if (snapshotText.trim().length === 0) {
      throw new Error('rendered snapshot is blank')
    }

    for (const text of expectedText) {
      if (!snapshotText.includes(text)) {
        throw new Error(`rendered snapshot is missing ${JSON.stringify(text)}`)
      }
    }

    const screenshotResult = runAgentTty(homePath, [
      'screenshot',
      sessionId,
      '--json',
    ])

    await writeFile(
      path.join(themeRoot, 'screenshot.json'),
      screenshotResult.stdout,
      'utf8',
    )
  } finally {
    if (sessionId) {
      runAgentTty(homePath, ['send-keys', sessionId, 'Ctrl+C', '--json'], {
        allowFailure: true,
      })
      runAgentTty(homePath, ['destroy', sessionId, '--json'], {
        allowFailure: true,
      })
    }
  }
}

async function assertAgentTtyAvailable() {
  const result = runCommand('agent-tty', ['version', '--json'], {
    allowFailure: true,
  })

  if (result.status === 0) {
    return
  }

  throw new Error(
    'agent-tty is required for local TUI E2E tests. Install it with `npm install -g agent-tty`.',
  )
}

function runAgentTty(
  homePath: string,
  args: string[],
  options: { allowFailure?: boolean } = {},
) {
  return runCommand('agent-tty', ['--home', homePath, ...args], options)
}

function runCommand(
  command: string,
  args: string[],
  options: { allowFailure?: boolean } = {},
): CommandResult {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      LC_ALL: 'C',
    },
  })

  const output = {
    stderr: result.stderr ?? '',
    stdout: result.stdout ?? '',
    status: result.status,
  }

  if (!options.allowFailure && output.status !== 0) {
    throw new Error(
      [
        `${command} ${args.join(' ')} exited with ${String(output.status)}`,
        output.stderr.trim(),
        output.stdout.trim(),
      ]
        .filter(Boolean)
        .join('\n'),
    )
  }

  return output
}

function getSessionId(result: CommandResult) {
  const parsed = parseJsonEnvelope(result.stdout)
  const sessionId = parsed.result?.sessionId

  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    throw new Error('agent-tty create did not return a session id')
  }

  return sessionId
}

function getTextPayload(stdout: string) {
  const parsed = parseJsonEnvelope(stdout)
  const text = findStringValue(parsed.result, ['text', 'snapshot', 'content'])

  if (text === null) {
    throw new Error('agent-tty snapshot did not return text content')
  }

  return text
}

function parseJsonEnvelope(stdout: string): {
  result?: Record<string, unknown>
} {
  try {
    return JSON.parse(stdout) as { result?: Record<string, unknown> }
  } catch (error) {
    throw new Error(
      `agent-tty returned invalid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}

function findStringValue(
  value: unknown,
  keys: readonly string[],
): string | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  if (Array.isArray(value)) {
    for (const child of value) {
      const found = findStringValue(child, keys)

      if (found !== null) {
        return found
      }
    }

    return null
  }

  const record = value as Record<string, unknown>

  for (const key of keys) {
    if (typeof record[key] === 'string') {
      return record[key]
    }
  }

  for (const child of Object.values(record)) {
    const found = findStringValue(child, keys)

    if (found !== null) {
      return found
    }
  }

  return null
}

function shellQuote(value: string) {
  return `'${value.replaceAll("'", "'\\''")}'`
}
