import { ConfigService } from '@harbr/config'
import { ReconcilerService } from '@harbr/reconciler'
import { Effect } from 'effect'

import { formatCliError, formatCliOutput } from '~/cli/format'
import { formatSyncHelp, isHelpRequest } from '~/cli/help'
import { readArgValue } from '~/helpers/args'
import {
  checkProfileEndpoint,
  formatProfileEndpointError,
  getProfileMissingValueFlag,
  readProfileOptions,
} from '~/observability/profile-options'
import { makeTuiEffectRuntime } from '~/services/effect-runtime'

export async function runSyncCommand(args: string[]) {
  if (isHelpRequest(args)) {
    console.log(formatSyncHelp())
    process.exitCode = 0
    return
  }

  const jsonMode = args.includes('--json')
  const configPath = readArgValue(args, '--path')
  const dbPath = readArgValue(args, '--db-path')
  const profile = readProfileOptions(args)

  const missingFlag =
    getMissingValueFlag(args, ['--path', '--db-path']) ??
    getProfileMissingValueFlag(args)

  if (missingFlag) {
    console.error(`missing value for ${missingFlag}`)
    process.exitCode = 1
    return
  }

  if (profile && !(await checkProfileEndpoint(profile.endpoint))) {
    console.error(formatProfileEndpointError(profile.endpoint))
    process.exitCode = 1
    return
  }

  const runtime = makeTuiEffectRuntime({
    ...(configPath ? { configPath } : {}),
    ...(dbPath ? { dbPath } : {}),
    ...(profile ? { profile } : {}),
  })

  const result = await runtime
    .runPromise(
      Effect.gen(function* () {
        const configService = yield* ConfigService
        const config = yield* configService.load
        const reconciler = yield* ReconcilerService

        return yield* reconciler.syncProjects(config.projects)
      }).pipe(
        Effect.withSpan('harbr.sync', {
          attributes: profile
            ? {
                'harbr.profile.session_id': profile.sessionId,
              }
            : {},
        }),
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
    .finally(() => runtime.dispose())

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
