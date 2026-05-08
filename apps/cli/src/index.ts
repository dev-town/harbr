import { loadConfig, loadConfigAtPath } from '@harbour/config'
import type { ProjectScan } from '@harbour/domain'
import { inspectRepo, type RepoInspection, type RepoInspectionError } from '@harbour/git'
import { scanProject } from '@harbour/scanner'
import { Either, Effect } from 'effect'

type ProjectRepoResult =
  | {
      project: string
      repo: RepoInspection
      scan: ProjectScan | null
    }
  | {
      project: string
      error: RepoInspectionError
    }

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
    console.error(JSON.stringify(result.left, null, 2))
    process.exitCode = 1
  } else {
    console.log(JSON.stringify(result.right, null, 2))
  }
}

function scanProjectRepo(project: {
  name: string
  repo: string
  modules: { raw: string; path: string; mode: 'children' | 'explicit' }[]
}): Effect.Effect<ProjectRepoResult, never, never> {
  return inspectRepo(project.repo).pipe(
    Effect.flatMap((repo): Effect.Effect<ProjectRepoResult, never, never> =>
      repo.kind === 'standard'
        ? scanProject(project, repo.repoPath).pipe(
            Effect.map((scan) => ({ project: project.name, repo, scan })),
          )
        : Effect.succeed({ project: project.name, repo, scan: null }),
    ),
    Effect.catchAll((error) => Effect.succeed({ project: project.name, error })),
  )
}
