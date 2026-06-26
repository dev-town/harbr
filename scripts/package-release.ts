#!/usr/bin/env bun

import { chmod, copyFile, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'

type PackageJson = {
  version?: string
}

type ReleaseTarget = {
  readonly name: string
  readonly bunTarget: string
}

const releaseTargets = [
  { name: 'darwin-arm64', bunTarget: 'bun-darwin-arm64' },
  { name: 'darwin-x64', bunTarget: 'bun-darwin-x64' },
  { name: 'linux-arm64', bunTarget: 'bun-linux-arm64' },
  { name: 'linux-x64', bunTarget: 'bun-linux-x64' },
] as const satisfies ReadonlyArray<ReleaseTarget>

const rootPackage = (await Bun.file('package.json').json()) as PackageJson
const version = rootPackage.version

if (!version) {
  console.error('package.json is missing a version.')
  process.exit(1)
}

const releaseDir = join('dist', 'release')
const manifestPath = join(releaseDir, 'manifest.json')
const requiredFiles = ['LICENSE', 'NOTICE', 'README.md'] as const
const commandEnv = { ...Bun.env, LANG: 'C', LC_ALL: 'C' }

function artifactBase(target: ReleaseTarget): string {
  return `harbr-${version}-${target.name}`
}

async function sha256(path: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    await Bun.file(path).arrayBuffer(),
  )

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function run(
  command: string,
  args: Array<string>,
  options: { cwd?: string; env?: Record<string, string> } = {},
): Promise<string> {
  const childProcess = Bun.spawn([command, ...args], {
    cwd: options.cwd,
    env: { ...commandEnv, ...options.env },
    stderr: 'inherit',
    stdout: 'pipe',
  })
  const output = await new Response(childProcess.stdout).text()
  const exitCode = await childProcess.exited

  if (exitCode !== 0) {
    console.error(
      `${command} ${args.join(' ')} failed with exit code ${exitCode}.`,
    )
    process.exit(exitCode)
  }

  return output
}

async function runInherit(
  command: string,
  args: Array<string>,
  options: { cwd?: string; env?: Record<string, string> } = {},
): Promise<void> {
  const childProcess = Bun.spawn([command, ...args], {
    cwd: options.cwd,
    env: { ...commandEnv, ...options.env },
    stderr: 'inherit',
    stdout: 'inherit',
  })
  const exitCode = await childProcess.exited

  if (exitCode !== 0) {
    console.error(
      `${command} ${args.join(' ')} failed with exit code ${exitCode}.`,
    )
    process.exit(exitCode)
  }
}

await rm(releaseDir, { force: true, recursive: true })
await mkdir(releaseDir, { recursive: true })

const createdArtifacts: Array<{
  name: string
  path: string
  sha256: string
  target: string
}> = []

for (const target of releaseTargets) {
  const base = artifactBase(target)
  const stageDir = join(releaseDir, base)
  const artifactPath = join(releaseDir, `${base}.tar.gz`)
  const buildOutfile = `./dist/harbr-${target.name}`
  const binaryPath = join('apps', 'tui', buildOutfile)
  const stagedBinaryPath = join(stageDir, 'harbr')

  await runInherit('bun', ['scripts/build.ts'], {
    cwd: 'apps/tui',
    env: {
      HARBR_BUILD_OUTFILE: buildOutfile,
      HARBR_BUILD_TARGET: target.bunTarget,
    },
  })

  await mkdir(stageDir, { recursive: true })
  await copyFile(binaryPath, stagedBinaryPath)
  await chmod(stagedBinaryPath, 0o755)

  for (const file of requiredFiles) {
    await copyFile(file, join(stageDir, file))
  }

  await runInherit('tar', ['-czf', artifactPath, '-C', releaseDir, base])

  const artifactContents = await run('tar', ['-tzf', artifactPath])

  const checksum = await sha256(artifactPath)
  createdArtifacts.push({
    name: `${base}.tar.gz`,
    path: artifactPath,
    sha256: checksum,
    target: target.name,
  })

  console.log(`Created ${artifactPath}`)
  console.log(`SHA256 ${checksum}`)
  console.log('')
  console.log('Artifact contents:')
  console.log(artifactContents.trim())
  console.log('')
}

await runInherit('bun', ['scripts/build.ts'], { cwd: 'apps/tui' })

await Bun.write(
  manifestPath,
  `${JSON.stringify({ artifacts: createdArtifacts, version }, null, 2)}\n`,
)

console.log('Release artifacts:')
for (const artifact of createdArtifacts) {
  console.log(`- ${artifact.path}`)
  console.log(`  sha256: ${artifact.sha256}`)
}
console.log('')
console.log(`Wrote ${manifestPath}`)
