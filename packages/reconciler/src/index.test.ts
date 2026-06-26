import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import {
  DatabaseClientLive,
  DatabaseClientOptions,
  ProjectService,
  ProjectServiceLive,
} from '@harbr/db'
import { type ProjectConfig, type ProjectObservation } from '@harbr/domain'
import { GitServiceLive, RepoNotGitError } from '@harbr/git'
import {
  RuntimeDiscoveryService,
  type RuntimeDiscoveryServiceApi,
} from '@harbr/runtime-tmux/discovery'
import { Effect, Either, Layer } from 'effect'
import { ScannerService, ScannerServiceLive } from '@harbr/scanner'
import { afterEach, describe, expect, it } from 'vitest'

import { ReconcilerService, ReconcilerServiceLive } from './index'

const execFileAsync = promisify(execFile)
const tempRoots: string[] = []

afterEach(async () => {
  await Promise.all(
    tempRoots
      .splice(0)
      .map((tempRoot) => rm(tempRoot, { recursive: true, force: true })),
  )
})

describe('reconciler', () => {
  it('syncs configured projects and persists snapshots', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const dbPath = path.join(tempRoot, 'harbour.db')

    await execFileAsync('git', ['init', repoPath])
    await mkdir(path.join(repoPath, 'apps', 'cli'), { recursive: true })
    const projects = [createProjectConfig('alpha', repoPath, 'apps/')]

    const result = await Effect.runPromise(
      Effect.flatMap(ReconcilerService, (service) =>
        service.syncProjects(projects),
      ).pipe(Effect.provide(makeTestReconcilerLayer(dbPath))),
    )

    expect(result.projects).toHaveLength(1)
    expect(result.projects[0]).toMatchObject({
      projectName: 'alpha',
      repoPath,
      repoKind: 'standard',
      workspaceCount: 1,
      moduleCount: 1,
      status: 'synced',
      errorTag: null,
    })
    expect([null, 'tmux_not_found']).toContain(
      result.projects[0]?.runtimeIssue ?? null,
    )

    const project = await Effect.runPromise(
      Effect.flatMap(ProjectService, (service) =>
        service.findByName('alpha'),
      ).pipe(Effect.provide(makeTestProjectServiceLayer(dbPath))),
    )

    expect(project?.repoPath).toBe(repoPath)
  })

  it('persists project only when bare repo has no linked workspace', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo.git')
    const dbPath = path.join(tempRoot, 'harbour.db')

    await execFileAsync('git', ['init', '--bare', repoPath])
    const projects = [createProjectConfig('alpha', repoPath, 'docs')]

    const result = await Effect.runPromise(
      Effect.flatMap(ReconcilerService, (service) =>
        service.refreshProject(projects[0]!),
      ).pipe(Effect.provide(makeTestReconcilerLayer(dbPath))),
    )

    expect(result).toMatchObject({
      projectName: 'alpha',
      repoPath,
      repoKind: 'bare',
      workspaceCount: 0,
      moduleCount: 0,
      status: 'no_workspace',
      errorTag: null,
    })
    expect([null, 'tmux_not_found']).toContain(result.runtimeIssue)
  })

  it('isolates per-project failures during sync', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const plainDirPath = path.join(tempRoot, 'plain-dir')
    const dbPath = path.join(tempRoot, 'harbour.db')

    await execFileAsync('git', ['init', repoPath])
    await mkdir(path.join(repoPath, 'docs'), { recursive: true })
    await mkdir(plainDirPath, { recursive: true })
    const projects = [
      createProjectConfig('alpha', repoPath, 'docs'),
      createProjectConfig('beta', plainDirPath, 'docs'),
    ]

    const result = await Effect.runPromise(
      Effect.flatMap(ReconcilerService, (service) =>
        service.syncProjects(projects),
      ).pipe(Effect.provide(makeTestReconcilerLayer(dbPath))),
    )

    expect(result.projects).toHaveLength(2)
    expect(result.projects[0]).toMatchObject({
      projectName: 'alpha',
      repoPath,
      repoKind: 'standard',
      workspaceCount: 1,
      moduleCount: 1,
      status: 'synced',
      errorTag: null,
    })
    expect([null, 'tmux_not_found']).toContain(
      result.projects[0]?.runtimeIssue ?? null,
    )
    expect(result.projects[1]).toEqual({
      projectName: 'beta',
      repoPath: plainDirPath,
      repoKind: null,
      workspaceCount: 0,
      moduleCount: 0,
      runtimeCount: 0,
      status: 'error',
      errorTag: 'RepoNotGitError',
      runtimeIssue: null,
    })
  })

  it('can run against provided service layers', async () => {
    const persistedProjects: string[] = []
    const alpha = createProjectConfig('alpha')
    const beta = createProjectConfig('beta')

    const projects = [alpha, beta]

    const layer = ReconcilerServiceLive.pipe(
      Layer.provide(
        Layer.succeed(ScannerService, {
          observeProjects: (projects) =>
            Effect.succeed(
              projects.map((project) => ({
                project,
                result:
                  project.name === 'alpha'
                    ? Either.right(createObservation(project))
                    : Either.left(
                        new RepoNotGitError({ repoPath: project.repo }),
                      ),
              })),
            ),
          observeProject: () => Effect.die('not used'),
        }),
      ),
      Layer.provide(
        Layer.succeed(ProjectService, {
          findByName: () => Effect.succeed(null),
          loadUiContext: Effect.succeed({}),
          listActiveRuntimeSummaries: Effect.die('not used'),
          listModuleSummaries: () => Effect.die('not used'),
          listProjectSummaries: Effect.die('not used'),
          listWorkspaceSummaries: () => Effect.die('not used'),
          saveUiContext: () => Effect.die('not used'),
          syncSnapshot: (input) => {
            persistedProjects.push(input.projectName)
            return Effect.succeed({
              project: {
                id: input.projectName,
                name: input.projectName,
                repoPath: input.repoPath,
                repoKind: input.repoKind,
                createdAt: 0,
                updatedAt: 0,
              },
              workspaces: input.workspaces.map((workspace) => ({
                id: `${input.projectName}-${workspace.workspaceName}`,
                projectId: input.projectName,
                kind: workspace.kind,
                name: workspace.workspaceName,
                workspacePath: workspace.workspacePath,
                createdAt: 0,
                updatedAt: 0,
              })),
              modules: [],
              runtimes: [],
            })
          },
        }),
      ),
    )

    await expect(
      Effect.runPromise(
        Effect.flatMap(ReconcilerService, (service) =>
          service.syncProjects(projects),
        ).pipe(Effect.provide(layer)),
      ),
    ).resolves.toEqual({
      projects: [
        {
          projectName: 'alpha',
          repoPath: '/tmp/alpha.git',
          repoKind: 'standard',
          workspaceCount: 1,
          moduleCount: 1,
          runtimeCount: 0,
          status: 'synced',
          errorTag: null,
          runtimeIssue: 'tmux_not_found',
        },
        {
          projectName: 'beta',
          repoPath: '/tmp/beta.git',
          repoKind: null,
          workspaceCount: 0,
          moduleCount: 0,
          runtimeCount: 0,
          status: 'error',
          errorTag: 'RepoNotGitError',
          runtimeIssue: null,
        },
      ],
    })

    expect(persistedProjects).toEqual(['alpha'])
  })
})

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(tmpdir(), 'harbour-reconciler-'))
  tempRoots.push(tempRoot)
  return tempRoot
}

function createProjectConfig(
  name: string,
  repo = `/tmp/${name}.git`,
  module = 'apps/',
): ProjectConfig {
  return {
    name,
    repo,
    modules: [
      {
        raw: module,
        path: module.endsWith('/') ? module.slice(0, -1) : module,
        mode: module.endsWith('/') ? 'children' : 'explicit',
      },
    ],
    windows: [],
  }
}

function makeTestReconcilerLayer(dbPath: string) {
  const runtimeDiscovery: RuntimeDiscoveryServiceApi = {
    listRuntimes: Effect.succeed({ runtimes: [], runtimeIssue: null }),
  }

  const scanner = ScannerServiceLive.pipe(
    Layer.provide(GitServiceLive),
    Layer.provide(Layer.succeed(RuntimeDiscoveryService, runtimeDiscovery)),
  )

  return ReconcilerServiceLive.pipe(
    Layer.provide(makeTestProjectServiceLayer(dbPath)),
    Layer.provide(scanner),
  )
}

function makeTestProjectServiceLayer(dbPath: string) {
  const database = DatabaseClientLive.pipe(
    Layer.provide(Layer.succeed(DatabaseClientOptions, { dbPath })),
  )

  return ProjectServiceLive.pipe(Layer.provide(database))
}

function createObservation(project: ProjectConfig): ProjectObservation {
  return {
    projectName: project.name,
    repoPath: project.repo,
    repoKind: 'standard',
    workspaces: [
      {
        workspaceName: 'main',
        workspacePath: `/tmp/${project.name}-main`,
        kind: 'default',
        modules: [
          {
            name: 'apps/cli',
            path: 'apps/cli',
            workspacePath: `/tmp/${project.name}-main/apps/cli`,
            selector: { raw: 'apps/', path: 'apps', mode: 'children' },
          },
        ],
      },
    ],
    runtimes: [],
    runtimeIssue: 'tmux_not_found',
  }
}
