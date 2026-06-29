import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'

import { formatProfileHelp, isHelpRequest } from '~/cli/help'

const profileDir = path.join(homedir(), '.local', 'share', 'harbr', 'profile')
const composePath = path.join(profileDir, 'docker-compose.yml')
const projectName = 'harbr-observability'

const otlpEndpoint = 'http://localhost:4318'
const jaegerUrl = 'http://localhost:16686'

const composeFile = `services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: harbr-jaeger
    environment:
      COLLECTOR_OTLP_ENABLED: "true"
    ports:
      - "16686:16686"
      - "4317:4317"
      - "4318:4318"
`

export async function runProfileCommand(args: string[]) {
  if (isHelpRequest(args)) {
    console.log(formatProfileHelp())
    process.exitCode = 0
    return
  }

  const action = args[0] ?? 'status'

  switch (action) {
    case 'up':
      ensureProfileFiles()
      runDockerCompose(['up', '-d'])
      console.log(`OTLP endpoint: ${otlpEndpoint}`)
      console.log(`Jaeger UI: ${jaegerUrl}`)
      return
    case 'down':
      ensureProfileFiles()
      runDockerCompose(['down'])
      return
    case 'status':
      ensureProfileFiles()
      runDockerCompose(['ps'])
      console.log(`OTLP endpoint: ${otlpEndpoint}`)
      console.log(`Jaeger UI: ${jaegerUrl}`)
      return
    case 'url':
      console.log(jaegerUrl)
      return
    default:
      console.error(`unknown profile command: ${action}`)
      console.error('')
      console.error(formatProfileHelp())
      process.exitCode = 1
  }
}

function ensureProfileFiles() {
  mkdirSync(profileDir, { recursive: true })
  writeFileSync(composePath, composeFile)
}

function runDockerCompose(args: string[]) {
  const result = spawnSync(
    'docker',
    ['compose', '-f', composePath, '-p', projectName, ...args],
    {
      stdio: 'inherit',
    },
  )

  if (result.error) {
    console.error(`docker compose failed: ${result.error.message}`)
    process.exitCode = 1
    return
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1
  }
}
