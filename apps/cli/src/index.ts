import { Either, Effect } from 'effect'
import { sync } from '@harbour/reconciler'
import {
  formatCliError,
  formatCliOutput,
  type CliOutput,
} from './format'

const args = process.argv.slice(2)
const jsonMode = args.includes('--json')

const configPathFlagIndex = args.indexOf('--path')
const configPath =
  configPathFlagIndex >= 0 ? args[configPathFlagIndex + 1] : undefined

if (configPathFlagIndex >= 0 && !configPath) {
  console.error('missing value for --path')
  process.exitCode = 1
} else {
  const program = sync(
    configPath
      ? {
          configPath,
        }
      : undefined,
  ).pipe(Effect.map((result) => ({ projects: result.projects } satisfies CliOutput)))

  const result = await Effect.runPromise(Effect.either(program))

  if (Either.isLeft(result)) {
    console.error(
      jsonMode ? JSON.stringify(result.left, null, 2) : formatCliError(result.left),
    )
    process.exitCode = 1
  } else {
    console.log(
      jsonMode
        ? JSON.stringify(result.right, null, 2)
        : formatCliOutput(result.right satisfies CliOutput),
    )
  }
}
