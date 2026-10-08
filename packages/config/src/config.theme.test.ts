import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { readConfigTheme } from './config.theme'

const tempRoots: string[] = []

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { force: true, recursive: true })),
  )
})

describe('readConfigTheme', () => {
  it('reads a structurally valid configured theme without inspecting repos', async () => {
    const tempRoot = await createTempRoot()
    const configPath = path.join(tempRoot, 'config.json')

    await writeFile(
      configPath,
      JSON.stringify({
        theme: 'nord',
        projects: [{ name: 'missing', repo: '/does/not/exist' }],
      }),
      'utf8',
    )

    await expect(readConfigTheme(configPath)).resolves.toEqual({
      loaded: true,
      theme: 'nord',
    })
  })

  it('falls back to system for an invalid config', async () => {
    const tempRoot = await createTempRoot()
    const configPath = path.join(tempRoot, 'config.json')

    await writeFile(configPath, JSON.stringify({ theme: 'unknown', projects: [] }), 'utf8')

    await expect(readConfigTheme(configPath)).resolves.toEqual({
      loaded: false,
      theme: 'system',
    })
  })
})

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(tmpdir(), 'harbr-config-theme-'))
  tempRoots.push(tempRoot)
  return tempRoot
}
