import { Effect } from 'effect'
import { makeReconcilerLayer, syncProgram } from '@harbour/reconciler'
import { formatCliError, formatCliOutput } from './format'

const args = process.argv.slice(2)
const jsonMode = args.includes('--json')

const configPathFlagIndex = args.indexOf('--path')
const configPath =
  configPathFlagIndex >= 0 ? args[configPathFlagIndex + 1] : undefined

if (configPathFlagIndex >= 0 && !configPath) {
  console.error('missing value for --path')
  process.exitCode = 1
} else {
  const layer = makeReconcilerLayer(
    configPath
      ? {
          configPath,
        }
      : undefined,
  )

  const program = syncProgram.pipe(Effect.provide(layer))

  const result = await Effect.runPromise(
    program.pipe(
      Effect.match({
        onFailure: (error) => ({
          exitCode: 1,
          output: jsonMode
            ? JSON.stringify(error, null, 2)
            : formatCliError(error),
          stream: 'stderr' as const,
        }),
        onSuccess: (output) => ({
          exitCode: 0,
          output: jsonMode
            ? JSON.stringify(output, null, 2)
            : formatCliOutput(output),
          stream: 'stdout' as const,
        }),
      }),
    ),
  )

  if (result.stream === 'stderr') {
    console.error(result.output)
  } else {
    console.log(result.output)
  }

  process.exitCode = result.exitCode
}
