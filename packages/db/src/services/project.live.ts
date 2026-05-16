import { Effect, Layer } from 'effect'

import { ProjectServiceError } from '../db.errors'
import {
  DatabaseClient,
} from '../infra/database-client.service'
import { makeDatabaseClientLayer } from '../infra/database-client.live'
import {
  getProjectByName as getProjectByNameRaw,
  replaceProjectSnapshot as replaceProjectSnapshotRaw,
} from '../repos/project-snapshot.repo'
import type { ProjectServiceApi } from '../db.types'
import { ProjectService } from './project.service'

export const ProjectServiceLive = Layer.effect(
  ProjectService,
  Effect.gen(function* () {
    const database = yield* DatabaseClient

    return {
      findByName: (projectName) =>
        Effect.try({
          try: () => getProjectByNameRaw(database.db, projectName),
          catch: (error) =>
            new ProjectServiceError({
              operation: 'findByName',
              message: error instanceof Error ? error.message : String(error),
            }),
        }),
      syncSnapshot: (input) =>
        Effect.try({
          try: () => replaceProjectSnapshotRaw(database.db, input),
          catch: (error) =>
            new ProjectServiceError({
              operation: 'syncSnapshot',
              message: error instanceof Error ? error.message : String(error),
            }),
        }),
    } satisfies ProjectServiceApi
  }),
)

export function makeProjectServiceLayer(dbPath?: string) {
  return ProjectServiceLive.pipe(
    Layer.provide(makeDatabaseClientLayer(dbPath)),
  )
}
