import { ConfigService } from '@harbr/config'
import { ReconcilerService } from '@harbr/reconciler'
import { Cause, Effect, Exit } from 'effect'

import { formatCliError, formatCliOutput } from '~/cli/format'
import { formatSyncHelp, isHelpRequest } from '~/cli/help'
import { readArgValue } from '~/helpers/args'
import {
  checkProfileEndpoint,
  formatProfileEndpointError,
  getProfileMissingValueFlag,
  readProfileOptions,
} from '~/observability/profile-options'
import { makeSyncEffectRuntime } from '~/services/effect-runtime'
import { makeConfigLayer, makeSyncLayer } from '~/services/layer'

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
    getMissingValueFlag(args, ['--path', '--db-path']) ?? getProfileMissingValueFlag(args)

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

  const runtime = makeSyncEffectRuntime({
    ...(profile ? { profile } : {}),
  })

  const result = await runtime
    .runPromiseExit(
      Effect.gen(function* () {
        const config = yield* Effect.gen(function* () {
          const configService = yield* ConfigService
          return yield* configService.load
        }).pipe(Effect.provide(makeConfigLayer(configPath ? { configPath } : {})))

        return yield* Effect.gen(function* () {
          const reconciler = yield* ReconcilerService
          return yield* reconciler.syncProjects(config.projects)
        }).pipe(Effect.provide(makeSyncLayer(dbPath ? { dbPath } : {})))
      }).pipe(
        Effect.withSpan('harbr.sync', {
          attributes: profile
            ? {
                'harbr.profile.session_id': profile.sessionId,
              }
            : {},
        }),
      ),
    )
    .finally(() => runtime.dispose())

  if (Exit.isFailure(result)) {
    console.error(formatSyncError(Cause.squash(result.cause), jsonMode))
    process.exitCode = 1
    return
  }

  console.log(jsonMode ? JSON.stringify(result.value, null, 2) : formatCliOutput(result.value))
  process.exitCode = 0
}

function formatSyncError(error: unknown, jsonMode: boolean) {
  const cliError =
    error !== null && typeof error === 'object' && '_tag' in error
      ? (error as Parameters<typeof formatCliError>[0])
      : {
          _tag: 'UnexpectedError',
          message: error instanceof Error ? error.message : String(error),
        }

  return jsonMode ? JSON.stringify(cliError, null, 2) : formatCliError(cliError)
}

function getMissingValueFlag(args: string[], flags: string[]) {
  return flags.find((flag) => {
    const flagIndex = args.indexOf(flag)
    return flagIndex >= 0 && !args[flagIndex + 1]
  })
}
