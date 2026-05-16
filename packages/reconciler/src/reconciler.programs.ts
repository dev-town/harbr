import { Effect } from 'effect'

import { ReconcilerService } from './services/reconciler.service'

export const syncProgram = Effect.flatMap(
  ReconcilerService,
  (service) => service.sync,
)

export function refreshProjectProgram(projectName: string) {
  return Effect.flatMap(ReconcilerService, (service) =>
    service.refreshProject(projectName),
  )
}
