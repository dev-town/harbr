import { loadConfig, loadConfigAtPath } from '@harbour/config'
import { inspectRepo } from '@harbour/git'
import { Either, Effect } from 'effect'

const args = process.argv.slice(2)

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
      Effect.forEach(config.projects, (project) =>
        inspectRepo(project.repo).pipe(
          Effect.map((repo) => ({ project: project.name, repo })),
          Effect.catchAll((error) =>
            Effect.succeed({ project: project.name, error }),
          ),
        ),
      ).pipe(
        Effect.map((repos) => ({
          config,
          repos,
        })),
      ),
    ),
  )

  const result = await Effect.runPromise(Effect.either(program))

  if (Either.isLeft(result)) {
    console.error(JSON.stringify(result.left, null, 2))
    process.exitCode = 1
  } else {
    console.log(JSON.stringify(result.right, null, 2))
  }
}
