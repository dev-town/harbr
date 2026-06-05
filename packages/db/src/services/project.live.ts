import { Effect, Layer } from 'effect'

import { ProjectServiceError } from '../db.errors'
import {
  DatabaseClient,
} from '../infra/database-client.service'
import { makeDatabaseClientLayer } from '../infra/database-client.live'
import {
  getProjectByName as getProjectByNameRaw,
  listActiveRuntimeSummaries as listActiveRuntimeSummariesRaw,
  loadUiContext as loadUiContextRaw,
  listModuleSummaries as listModuleSummariesRaw,
  listProjectSummaries as listProjectSummariesRaw,
  listWorkspaceSummaries as listWorkspaceSummariesRaw,
  replaceProjectSnapshot as replaceProjectSnapshotRaw,
  saveUiContext as saveUiContextRaw,
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
      loadUiContext: Effect.try({
        try: () => loadUiContextRaw(database.db),
        catch: (error) =>
          new ProjectServiceError({
            operation: 'loadUiContext',
            message: error instanceof Error ? error.message : String(error),
          }),
      }),
      listProjectSummaries: Effect.try({
        try: () => listProjectSummariesRaw(database.db),
        catch: (error) =>
          new ProjectServiceError({
            operation: 'listProjectSummaries',
            message: error instanceof Error ? error.message : String(error),
          }),
      }),
      listActiveRuntimeSummaries: Effect.try({
        try: () => listActiveRuntimeSummariesRaw(database.db),
        catch: (error) =>
          new ProjectServiceError({
            operation: 'listActiveRuntimeSummaries',
            message: error instanceof Error ? error.message : String(error),
          }),
      }),
      listWorkspaceSummaries: (projectId) =>
        Effect.try({
          try: () => listWorkspaceSummariesRaw(database.db, projectId),
          catch: (error) =>
            new ProjectServiceError({
              operation: 'listWorkspaceSummaries',
              message: error instanceof Error ? error.message : String(error),
            }),
        }),
      listModuleSummaries: (workspaceId) =>
        Effect.try({
          try: () => listModuleSummariesRaw(database.db, workspaceId),
          catch: (error) =>
            new ProjectServiceError({
              operation: 'listModuleSummaries',
              message: error instanceof Error ? error.message : String(error),
            }),
        }),
      saveUiContext: (context) =>
        Effect.try({
          try: () => saveUiContextRaw(database.db, context),
          catch: (error) =>
            new ProjectServiceError({
              operation: 'saveUiContext',
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
