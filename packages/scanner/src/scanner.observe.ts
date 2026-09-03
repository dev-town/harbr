import path from 'node:path'

import type {
  ProjectConfig,
  ProjectObservation,
  RuntimeFact,
  RuntimeObservation,
} from '@harbr/domain'
import type { GitServiceApi } from '@harbr/git'
import type { RuntimeDiscovery, RuntimeDiscoveryServiceApi } from '@harbr/runtime/discovery'
import { Effect } from 'effect'

import { scanProject } from './scanner.scan'
import { detectWorkspaceProvider } from './workspace-provider'
import type { ProjectObservationResult } from './services/scanner.service'

const scannerConcurrency = 'unbounded' as const

export function observeProjectsWithGit(
  git: GitServiceApi,
  runtimeDiscovery: RuntimeDiscoveryServiceApi,
  projects: readonly ProjectConfig[],
) {
  return runtimeDiscovery.listRuntimes.pipe(
    Effect.flatMap((discovery) =>
      Effect.forEach(
        projects,
        (project) =>
          observeProjectWithDiscovery(git, discovery, project).pipe(
            Effect.either,
            Effect.map(
              (result) =>
                ({
                  project,
                  result,
                }) satisfies ProjectObservationResult,
            ),
          ),
        { concurrency: scannerConcurrency },
      ),
    ),
  )
}

export function observeProjectWithGit(
  git: GitServiceApi,
  runtimeDiscovery: RuntimeDiscoveryServiceApi,
  project: ProjectConfig,
) {
  return runtimeDiscovery.listRuntimes.pipe(
    Effect.flatMap((discovery) => observeProjectWithDiscovery(git, discovery, project)),
  )
}

function observeProjectWithDiscovery(
  git: GitServiceApi,
  discovery: RuntimeDiscovery,
  project: ProjectConfig,
) {
  return git.inspectRepo(project.repo).pipe(
    Effect.flatMap((repo) =>
      Effect.all(
        {
          projectIssue: git.getDefaultBranchIssue(repo),
          workspaces: git.listWorkspaces(repo),
        },
        { concurrency: scannerConcurrency },
      ).pipe(
        Effect.flatMap(({ projectIssue, workspaces }) =>
          Effect.all(
            workspaces.map((workspace) => scanWorkspace(project, workspace)),
            { concurrency: scannerConcurrency },
          ).pipe(
            Effect.map(
              (observedWorkspaces) =>
                ({
                  observedRuntimes: discovery.runtimes.map((runtime) => ({
                    identity: runtime.identity,
                    status: runtime.status,
                  })),
                  projectIssue,
                  projectName: project.name,
                  repoPath: repo.repoPath,
                  repoKind: repo.kind,
                  workspaces: observedWorkspaces,
                  runtimes: discovery.runtimes
                    .map((runtime) =>
                      normalizeRuntimeObservation(runtime, project, observedWorkspaces),
                    )
                    .filter((runtime): runtime is RuntimeFact => runtime !== null),
                  runtimeIssue: discovery.runtimeIssue,
                  runtimeSource: discovery.source,
                }) satisfies ProjectObservation,
            ),
          ),
        ),
      ),
    ),
    Effect.withSpan('scanner.observeProject', {
      attributes: {
        'harbr.project.name': project.name,
      },
    }),
  )
}

function normalizeRuntimeObservation(
  runtime: RuntimeObservation,
  project: ProjectConfig,
  workspaces: ProjectObservation['workspaces'],
): RuntimeFact | null {
  if (!('contextPath' in runtime)) {
    return matchesProjectObservation(runtime, project.name, workspaces) ? runtime : null
  }

  const contextPath = path.resolve(runtime.contextPath)

  for (const workspace of workspaces) {
    const module = workspace.modules.find(
      (candidate) =>
        candidate.path !== '.' && path.resolve(candidate.workspacePath) === contextPath,
    )

    if (module) {
      return {
        identity: runtime.identity,
        moduleName: module.name,
        projectName: project.name,
        scope: 'module',
        status: runtime.status,
        workspaceName: workspace.workspaceName,
        workspacePath: workspace.workspacePath,
      }
    }
  }

  const workspace = workspaces.find(
    (candidate) => path.resolve(candidate.workspacePath) === contextPath,
  )

  if (workspace?.kind === 'worktree') {
    return {
      identity: runtime.identity,
      moduleName: null,
      projectName: project.name,
      scope: 'workspace',
      status: runtime.status,
      workspaceName: workspace.workspaceName,
      workspacePath: workspace.workspacePath,
    }
  }

  if (path.resolve(project.repo) === contextPath || workspace) {
    return {
      identity: runtime.identity,
      moduleName: null,
      projectName: project.name,
      scope: 'project',
      status: runtime.status,
      workspaceName: null,
    }
  }

  return null
}

function scanWorkspace(
  project: ProjectConfig,
  workspace: {
    readonly branchName?: string | null | undefined
    readonly kind: ProjectObservation['workspaces'][number]['kind']
    readonly name: string
    readonly path: string
  },
) {
  return scanProject(project, workspace.path).pipe(
    Effect.map((scan) => ({
      branchName: workspace.branchName,
      workspaceName: workspace.name,
      workspacePath: scan.workspacePath,
      workspaceProvider: detectWorkspaceProvider({
        branchName: workspace.branchName ?? null,
        kind: workspace.kind,
        repoPath: project.repo,
        workspacePath: scan.workspacePath,
      }),
      kind: workspace.kind,
      modules: scan.modules,
    })),
    Effect.withSpan('scanner.scanWorkspace', {
      attributes: {
        'harbr.project.name': project.name,
        'harbr.workspace.kind': workspace.kind,
        'harbr.workspace.name': workspace.name,
        'harbr.workspace.path': workspace.path,
      },
    }),
  )
}

function matchesProjectObservation(
  runtime: ProjectObservation['runtimes'][number],
  projectName: string,
  workspaces: ProjectObservation['workspaces'],
) {
  if (runtime.projectName !== projectName) {
    return false
  }

  if (runtime.scope === 'project') {
    return true
  }

  const workspace = workspaces.find(
    (candidate) => candidate.workspaceName === runtime.workspaceName,
  )

  if (!workspace) {
    return false
  }

  return (
    runtime.scope !== 'module' ||
    workspace.modules.some((module) => module.name === runtime.moduleName)
  )
}
