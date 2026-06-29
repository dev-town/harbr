import { ProjectService } from '@harbr/db'
import { ScannerService } from '@harbr/scanner'
import { Effect, Layer } from 'effect'

import {
  refreshConfiguredProject,
  syncProjects,
} from '../reconciler.operations'
import {
  ReconcilerService,
  type ReconcilerServiceApi,
} from './reconciler.service'

export const ReconcilerServiceLive = Layer.effect(
  ReconcilerService,
  Effect.gen(function* () {
    const scanner = yield* ScannerService
    const projectService = yield* ProjectService

    return {
      syncProjects: (projects) =>
        syncProjects(projects, scanner, projectService).pipe(
          Effect.withSpan('reconciler.syncProjects', {
            attributes: {
              'harbr.project.count': projects.length,
            },
          }),
        ),
      refreshProject: (project) =>
        refreshConfiguredProject(scanner, projectService, project).pipe(
          Effect.withSpan('reconciler.refreshProject', {
            attributes: {
              'harbr.project.name': project.name,
            },
          }),
        ),
    } satisfies ReconcilerServiceApi
  }),
)
