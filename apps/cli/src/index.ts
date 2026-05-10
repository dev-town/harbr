import { loadConfig, loadConfigAtPath } from '@harbour/config'
import type { ProjectConfig } from '@harbour/domain'
import {
  inspectRepo,
  resolveWorkspacePath,
} from '@harbour/git'
import { scanProject } from '@harbour/scanner'
import { Either, Effect } from 'effect'
import {
  formatCliError,
  formatCliOutput,
  type CliOutput,
  type ProjectRepoResult,
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
  const program = (
    configPath ? loadConfigAtPath(configPath) : loadConfig()
  ).pipe(
    Effect.flatMap((config) =>
      Effect.forEach(config.projects, scanProjectRepo).pipe(
        Effect.map((repos) => ({
          config,
          repos,
        })),
      ),
    ),
  )

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

function scanProjectRepo(
  project: ProjectConfig,
): Effect.Effect<ProjectRepoResult, never, never> {
  return inspectRepo(project.repo).pipe(
    Effect.flatMap((repo) =>
      resolveWorkspacePath(repo).pipe(
        Effect.flatMap(
          (workspacePath): Effect.Effect<ProjectRepoResult, never, never> =>
            workspacePath
              ? scanProject(project, workspacePath).pipe(
                  Effect.map(
                    (scan): ProjectRepoResult => ({
                      project: project.name,
                      repo,
                      scan,
                    }),
                  ),
                )
              : Effect.succeed<ProjectRepoResult>({
                  project: project.name,
                  repo,
                  scan: null,
                }),
        ),
      ),
    ),
    Effect.catchAll((error) =>
      Effect.succeed<ProjectRepoResult>({ project: project.name, error }),
    ),
  )
}
