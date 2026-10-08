import type {
  ActiveRuntimeSummary,
  ProjectObservation,
  RuntimeAttachment,
  RuntimeFact,
} from '@harbr/domain'
import type { ProjectObservationResult } from '@harbr/scanner'
import { Result } from 'effect'

export function stabilizeRuntimeFacts(
  observations: readonly ProjectObservationResult[],
  existing: readonly ActiveRuntimeSummary[],
): readonly ProjectObservationResult[] {
  const successful = observations.flatMap((observation) =>
    Result.isSuccess(observation.result)
      ? [{ value: observation.result.success }]
      : [],
  )
  const first = successful[0]?.value

  if (!first || first.runtimeIssue !== null) {
    return observations
  }

  const observedById = new Map(
    first.observedRuntimes.map((runtime) => [
      runtime.identity.externalId,
      runtime,
    ]),
  )
  const existingById = new Map(
    existing.map((runtime) => [runtime.runtime.identity.externalId, runtime]),
  )
  const candidateTargets = new Map<string, Set<string>>()

  for (const { value } of successful) {
    for (const runtime of value.runtimes) {
      const externalId = runtime.identity.externalId

      if (existingById.has(externalId)) {
        continue
      }

      const targets = candidateTargets.get(externalId) ?? new Set<string>()
      targets.add(runtimeTargetKey(runtime))
      candidateTargets.set(externalId, targets)
    }
  }

  return observations.map((observation) => {
    if (Result.isFailure(observation.result)) {
      return observation
    }

    const value = observation.result.success
    const newRuntimes = value.runtimes.filter((runtime) => {
      const externalId = runtime.identity.externalId

      return (
        !existingById.has(externalId) &&
        candidateTargets.get(externalId)?.size === 1
      )
    })
    const preservedRuntimes = existing.flatMap((runtime) => {
      const observed = observedById.get(runtime.runtime.identity.externalId)

      return observed &&
        runtime.projectName === value.projectName &&
        runtimeTargetExists(runtime, value)
        ? [runtimeSummaryToFact(runtime, observed)]
        : []
    })

    return {
      ...observation,
      result: Result.succeed({
        ...value,
        runtimes: [...newRuntimes, ...preservedRuntimes],
      }),
    }
  })
}

function runtimeTargetExists(
  runtime: ActiveRuntimeSummary,
  observation: ProjectObservation,
) {
  if (runtime.scope === 'project') {
    return true
  }

  const workspace = runtime.workspacePath
    ? observation.workspaces.find(
        (candidate) => candidate.workspacePath === runtime.workspacePath,
      )
    : observation.workspaces.find(
        (candidate) => candidate.workspaceName === runtime.workspaceName,
      )

  if (!workspace) {
    return false
  }

  return (
    runtime.scope === 'workspace' ||
    workspace.modules.some((module) => module.name === runtime.moduleName)
  )
}

function runtimeSummaryToFact(
  runtime: ActiveRuntimeSummary,
  observed: RuntimeAttachment,
): RuntimeFact {
  return {
    identity: observed.identity,
    moduleName: runtime.moduleName,
    projectName: runtime.projectName,
    scope: runtime.scope,
    status: observed.status,
    workspaceName: runtime.workspaceName,
    ...(runtime.workspacePath ? { workspacePath: runtime.workspacePath } : {}),
  }
}

function runtimeTargetKey(runtime: RuntimeFact) {
  return [
    runtime.projectName,
    runtime.workspacePath ?? runtime.workspaceName,
    runtime.moduleName,
  ].join('\u0000')
}
