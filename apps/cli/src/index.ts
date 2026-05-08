import { loadConfig, loadConfigAtPath } from '@harbour/config'

const args = process.argv.slice(2)

const configPathFlagIndex = args.indexOf('--path')
const configPath =
  configPathFlagIndex >= 0 ? args[configPathFlagIndex + 1] : undefined

if (configPathFlagIndex >= 0 && !configPath) {
  console.error('missing value for --path')
  process.exitCode = 1
} else {
  const result = configPath
    ? await loadConfigAtPath(configPath)
    : await loadConfig()

  if (!result.ok) {
    console.error(JSON.stringify(result.error, null, 2))
    process.exitCode = 1
  } else {
    console.log(JSON.stringify(result.value, null, 2))
  }
}
