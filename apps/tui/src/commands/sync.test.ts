import { existsSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { runSyncCommand } from './sync'

const tempRoots: string[] = []
const originalExitCode = process.exitCode

afterEach(async () => {
  vi.restoreAllMocks()
  process.exitCode = originalExitCode
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })))
})

describe('runSyncCommand', () => {
  it('does not acquire the database when config validation fails', async () => {
    const root = await createTempRoot()
    const dbPath = path.join(root, 'state.sqlite')
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await runSyncCommand(['--json', '--path', path.join(root, 'missing.json'), '--db-path', dbPath])

    expect(process.exitCode).toBe(1)
    expect(JSON.parse(String(error.mock.calls[0]?.[0]))).toMatchObject({
      _tag: 'ConfigNotFoundError',
    })
    expect(existsSync(dbPath)).toBe(false)
  })

  it('formats failures while constructing the database layer', async () => {
    const root = await createTempRoot()
    const configPath = await writeEmptyConfig(root)
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await runSyncCommand(['--json', '--path', configPath, '--db-path', root])

    expect(process.exitCode).toBe(1)
    expect(JSON.parse(String(error.mock.calls[0]?.[0]))).toMatchObject({
      _tag: 'DatabaseOpenError',
      dbPath: root,
    })
  })

  it('composes the reconciliation layer for a valid sync', async () => {
    const root = await createTempRoot()
    const configPath = await writeEmptyConfig(root)
    const dbPath = path.join(root, 'state.sqlite')
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await runSyncCommand(['--json', '--path', configPath, '--db-path', dbPath])

    expect(process.exitCode).toBe(0)
    expect(JSON.parse(String(log.mock.calls[0]?.[0]))).toEqual({ projects: [] })
    expect(existsSync(dbPath)).toBe(true)
  })
})

async function createTempRoot() {
  const root = await mkdtemp(path.join(tmpdir(), 'harbr-sync-layer-'))
  tempRoots.push(root)
  return root
}

async function writeEmptyConfig(root: string) {
  const configPath = path.join(root, 'config.json')
  await writeFile(configPath, JSON.stringify({ projects: [] }))
  return configPath
}
