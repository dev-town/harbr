import { homedir } from 'node:os'
import path from 'node:path'

export function getDefaultConfigPath() {
  return path.join(homedir(), '.config', 'harbr', 'config.json')
}

export function resolveTopLevelPath(inputPath: string) {
  return path.resolve(expandHome(inputPath))
}

function expandHome(inputPath: string) {
  if (inputPath === '~') {
    return homedir()
  }

  if (inputPath.startsWith('~/')) {
    return path.join(homedir(), inputPath.slice(2))
  }

  return inputPath
}
