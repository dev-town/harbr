import { ConfigService } from '@harbr/config'
import { ProjectService } from '@harbr/db'
import type { ActiveRuntimeSummary, HarbourContext } from '@harbr/domain'
import { RuntimeService } from '@harbr/runtime'
import { Effect } from 'effect'
import type { TuiServices } from '~/app-context'

export async function loadConfiguredProjects(services: TuiServices) {
  const config = await services.effectRuntime.runPromise(
    Effect.gen(function* () {
      const configService = yield* ConfigService

      return yield* configService.load
    }),
  )

  return config.projects
}

export async function loadUiContext(services: TuiServices) {
  return services.effectRuntime.runPromise(
    Effect.gen(function* () {
      const projects = yield* ProjectService

      return yield* projects.loadUiContext
    }),
  )
}

export async function listProjectSummaries(services: TuiServices) {
  return services.effectRuntime.runPromise(
    Effect.gen(function* () {
      const projects = yield* ProjectService
      const runtime = yield* RuntimeService

      return yield* projects.listProjectSummaries(runtime.source)
    }),
  )
}

export async function listActiveRuntimeSummaries(
  services: TuiServices,
): Promise<readonly ActiveRuntimeSummary[]> {
  return services.effectRuntime.runPromise(
    Effect.gen(function* () {
      const projects = yield* ProjectService
      const runtime = yield* RuntimeService

      return yield* projects.listActiveRuntimeSummaries(runtime.source)
    }),
  )
}

export async function listWorkspaceSummaries(services: TuiServices, projectId: string) {
  return services.effectRuntime.runPromise(
    Effect.gen(function* () {
      const projects = yield* ProjectService
      const runtime = yield* RuntimeService

      return yield* projects.listWorkspaceSummaries(projectId, runtime.source)
    }),
  )
}

export async function listModuleSummaries(services: TuiServices, workspaceId: string) {
  return services.effectRuntime.runPromise(
    Effect.gen(function* () {
      const projects = yield* ProjectService
      const runtime = yield* RuntimeService

      return yield* projects.listModuleSummaries(workspaceId, runtime.source)
    }),
  )
}

export async function saveUiContext(services: TuiServices, context: HarbourContext) {
  return services.effectRuntime.runPromise(
    Effect.gen(function* () {
      const projects = yield* ProjectService

      return yield* projects.saveUiContext(context)
    }),
  )
}

export async function listConfiguredProjectWindows(services: TuiServices) {
  const projects = await loadConfiguredProjects(services)

  return projects.map((project) => ({
    projectName: project.name,
    windows: project.windows ?? [],
  }))
}
