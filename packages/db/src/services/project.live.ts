import { Effect, Layer } from 'effect'

import { ProjectServiceError } from '../db.errors'
import { DatabaseClient } from '../infra/database-client.service'
import {
  getProjectByName as getProjectByNameRaw,
  listActiveRuntimeSummaries as listActiveRuntimeSummariesRaw,
  loadUiContext as loadUiContextRaw,
  listModuleSummaries as listModuleSummariesRaw,
  listProjectSummaries as listProjectSummariesRaw,
  listWorkspaceSummaries as listWorkspaceSummariesRaw,
  pruneRuntimeBindings as pruneRuntimeBindingsRaw,
  replaceProjectSnapshot as replaceProjectSnapshotRaw,
  saveUiContext as saveUiContextRaw,
} from '../repos/project-snapshot.repo'
import { ProjectService } from './project.service'
import type { ProjectServiceApi } from './project.types'

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
        }).pipe(
          Effect.withSpan('db.project.findByName', {
            attributes: {
              'harbr.project.name': projectName,
            },
          }),
        ),
      loadUiContext: Effect.try({
        try: () => loadUiContextRaw(database.db),
        catch: (error) =>
          new ProjectServiceError({
            operation: 'loadUiContext',
            message: error instanceof Error ? error.message : String(error),
          }),
      }).pipe(Effect.withSpan('db.project.loadUiContext')),
      listProjectSummaries: (source) =>
        Effect.try({
          try: () => listProjectSummariesRaw(database.db, source),
          catch: (error) =>
            new ProjectServiceError({
              operation: 'listProjectSummaries',
              message: error instanceof Error ? error.message : String(error),
            }),
        }).pipe(Effect.withSpan('db.project.listProjectSummaries')),
      listActiveRuntimeSummaries: (source) =>
        Effect.try({
          try: () => listActiveRuntimeSummariesRaw(database.db, source),
          catch: (error) =>
            new ProjectServiceError({
              operation: 'listActiveRuntimeSummaries',
              message: error instanceof Error ? error.message : String(error),
            }),
        }).pipe(Effect.withSpan('db.project.listActiveRuntimeSummaries')),
      listWorkspaceSummaries: (projectId, source) =>
        Effect.try({
          try: () => listWorkspaceSummariesRaw(database.db, projectId, source),
          catch: (error) =>
            new ProjectServiceError({
              operation: 'listWorkspaceSummaries',
              message: error instanceof Error ? error.message : String(error),
            }),
        }).pipe(
          Effect.withSpan('db.project.listWorkspaceSummaries', {
            attributes: {
              'harbr.project.id': projectId,
            },
          }),
        ),
      listModuleSummaries: (workspaceId, source) =>
        Effect.try({
          try: () => listModuleSummariesRaw(database.db, workspaceId, source),
          catch: (error) =>
            new ProjectServiceError({
              operation: 'listModuleSummaries',
              message: error instanceof Error ? error.message : String(error),
            }),
        }).pipe(
          Effect.withSpan('db.project.listModuleSummaries', {
            attributes: {
              'harbr.workspace.id': workspaceId,
            },
          }),
        ),
      pruneRuntimeBindings: (source, observedExternalIds) =>
        Effect.try({
          try: () => pruneRuntimeBindingsRaw(database.db, source, observedExternalIds),
          catch: (error) =>
            new ProjectServiceError({
              operation: 'pruneRuntimeBindings',
              message: error instanceof Error ? error.message : String(error),
            }),
        }).pipe(Effect.withSpan('db.project.pruneRuntimeBindings')),
      saveUiContext: (context) =>
        Effect.try({
          try: () => saveUiContextRaw(database.db, context),
          catch: (error) =>
            new ProjectServiceError({
              operation: 'saveUiContext',
              message: error instanceof Error ? error.message : String(error),
            }),
        }).pipe(Effect.withSpan('db.project.saveUiContext')),
      syncSnapshot: (input) =>
        Effect.try({
          try: () => replaceProjectSnapshotRaw(database.db, input),
          catch: (error) =>
            new ProjectServiceError({
              operation: 'syncSnapshot',
              message: error instanceof Error ? error.message : String(error),
            }),
        }).pipe(
          Effect.withSpan('db.project.syncSnapshot', {
            attributes: {
              'harbr.project.name': input.projectName,
            },
          }),
        ),
    } satisfies ProjectServiceApi
  }),
)
