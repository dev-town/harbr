import { loadConfig, loadConfigAtPath } from '@harbour/config'
import {
  getDefaultDatabasePath,
  migrateDatabase,
  openDatabase,
  replaceProjectSnapshot,
} from '@harbour/db'
import type { ProjectConfig, SyncProjectResult, SyncResult } from '@harbour/domain'
import { observeProject } from '@harbour/scanner'
import { Effect } from 'effect'

export class ProjectNotFoundError extends Error {
  readonly _tag = 'ProjectNotFoundError'

  constructor(readonly projectName: string) {
    super(`project not found: ${projectName}`)
  }
}

export type ReconcilerOptions = {
  configPath?: string
  dbPath?: string
}

export function sync(options: ReconcilerOptions = {}) {
  return withDatabase(options.dbPath, (database) =>
    Effect.gen(function* () {
      yield* Effect.promise(() => migrateDatabase(database))

      const config = yield* loadReconcilerConfig(options.configPath)
      const projects = yield* Effect.forEach(config.projects, (project) =>
        refreshConfiguredProject(database.db, project).pipe(
          Effect.catchAll((error) =>
            Effect.succeed<SyncProjectResult>({
              projectName: project.name,
              repoPath: project.repo,
              repoKind: null,
              workspacePath: null,
              moduleCount: 0,
              status: 'error',
              errorTag: getErrorTag(error),
            }),
          ),
        ),
      )

      return { projects } satisfies SyncResult
    }),
  )
}

export function refreshProject(
  projectName: string,
  options: ReconcilerOptions = {},
) {
  return withDatabase(options.dbPath, (database) =>
    Effect.gen(function* () {
      yield* Effect.promise(() => migrateDatabase(database))

      const config = yield* loadReconcilerConfig(options.configPath)
      const project = config.projects.find((entry) => entry.name === projectName)

      if (!project) {
        return yield* Effect.fail(new ProjectNotFoundError(projectName))
      }

      return yield* refreshConfiguredProject(database.db, project)
    }),
  )
}

function loadReconcilerConfig(configPath?: string) {
  return configPath ? loadConfigAtPath(configPath) : loadConfig()
}

function withDatabase<A, E>(
  dbPath: string | undefined,
  run: (database: Awaited<ReturnType<typeof openDatabase>>) => Effect.Effect<A, E>,
) {
  const targetPath = dbPath ?? getDefaultDatabasePath()

  return Effect.acquireUseRelease(
    Effect.promise(() => openDatabase(targetPath)),
    run,
    (database) => Effect.sync(() => database.sqlite.close()),
  )
}

function refreshConfiguredProject(
  database: Awaited<ReturnType<typeof openDatabase>>['db'],
  project: ProjectConfig,
) {
  return Effect.gen(function* () {
    const observation = yield* observeProject(project)

    yield* Effect.promise(() =>
      replaceProjectSnapshot(database, {
        projectName: observation.projectName,
        repoPath: observation.repoPath,
        repoKind: observation.repoKind,
        workspacePath: observation.workspacePath,
        modules: observation.modules,
      }),
    )

    return {
      projectName: observation.projectName,
      repoPath: observation.repoPath,
      repoKind: observation.repoKind,
      workspacePath: observation.workspacePath,
      moduleCount: observation.modules.length,
      status: observation.workspacePath ? 'synced' : 'no_workspace',
      errorTag: null,
    } satisfies SyncProjectResult
  })
}

function getErrorTag(error: unknown) {
  if (error instanceof Error && '_tag' in error) {
    return String(error._tag)
  }

  if (error instanceof Error) {
    return error.name
  }

  return 'UnknownError'
}
