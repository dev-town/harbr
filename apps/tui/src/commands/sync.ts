import { sync } from '@harbr/reconciler'
import { Effect } from 'effect'

import { formatCliError, formatCliOutput } from '../cli/format'
import { readArgValue } from '../helpers/args'

export async function runSyncCommand(args: string[]) {
  const jsonMode = args.includes('--json')
  const configPath = readArgValue(args, '--path')
  const dbPath = readArgValue(args, '--db-path')

  const missingFlag = getMissingValueFlag(args, ['--path', '--db-path'])

  if (missingFlag) {
    console.error(`missing value for ${missingFlag}`)
    process.exitCode = 1
    return
  }

  const options = {
    ...(configPath ? { configPath } : {}),
    ...(dbPath ? { dbPath } : {}),
  }

  const result = await Effect.runPromise(
    sync(options).pipe(
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

function getMissingValueFlag(args: string[], flags: string[]) {
  return flags.find((flag) => {
    const flagIndex = args.indexOf(flag)
    return flagIndex >= 0 && !args[flagIndex + 1]
  })
}
