import { ProjectService, makeProjectServiceLayer } from '@harbour/db'
import type { HarbourContext } from '@harbour/domain'
import { Effect } from 'effect'

export async function loadUiContext(dbPath?: string) {
  return Effect.runPromise(
    Effect.flatMap(ProjectService, (service) => service.loadUiContext).pipe(
      Effect.provide(makeProjectServiceLayer(dbPath)),
    ),
  )
}

export async function listProjectSummaries(dbPath?: string) {
  return Effect.runPromise(
    Effect.flatMap(ProjectService, (service) => service.listProjectSummaries).pipe(
      Effect.provide(makeProjectServiceLayer(dbPath)),
    ),
  )
}

export async function listWorkspaceSummaries(projectId: string, dbPath?: string) {
  return Effect.runPromise(
    Effect.flatMap(ProjectService, (service) => service.listWorkspaceSummaries(projectId)).pipe(
      Effect.provide(makeProjectServiceLayer(dbPath)),
    ),
  )
}

export async function listModuleSummaries(workspaceId: string, dbPath?: string) {
  return Effect.runPromise(
    Effect.flatMap(ProjectService, (service) => service.listModuleSummaries(workspaceId)).pipe(
      Effect.provide(makeProjectServiceLayer(dbPath)),
    ),
  )
}

export async function saveUiContext(context: HarbourContext, dbPath?: string) {
  return Effect.runPromise(
    Effect.flatMap(ProjectService, (service) => service.saveUiContext(context)).pipe(
      Effect.provide(makeProjectServiceLayer(dbPath)),
    ),
  )
}
