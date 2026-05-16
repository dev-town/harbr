import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import { ConfigService, type HarbourConfig } from '@harbour/config'
import { openDatabase, ProjectService } from '@harbour/db'
import { type ProjectConfig, type ProjectObservation } from '@harbour/domain'
import { RepoNotGitError } from '@harbour/git'
import { Either, Effect, Layer } from 'effect'
import { ScannerService } from '@harbour/scanner'
import { afterEach, describe, expect, it } from 'vitest'

import {
  ProjectNotFoundError,
  ReconcilerServiceLive,
  refreshProjectProgram,
  refreshProject,
  syncProgram,
  sync,
} from './index'

const execFileAsync = promisify(execFile)
const tempRoots: string[] = []

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { recursive: true, force: true })),
  )
})

describe('reconciler', () => {
  it('syncs configured projects and persists snapshots', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const configPath = path.join(tempRoot, 'harbour.json')
    const dbPath = path.join(tempRoot, 'harbour.db')

    await execFileAsync('git', ['init', repoPath])
    await mkdir(path.join(repoPath, 'apps', 'cli'), { recursive: true })
    await writeFile(
      configPath,
      JSON.stringify({
        projects: [
          {
            name: 'alpha',
            repo: repoPath,
            modules: ['apps/'],
          },
        ],
      }),
      'utf8',
    )

    const result = await Effect.runPromise(sync({ configPath, dbPath }))

    expect(result.projects).toHaveLength(1)
    expect(result.projects[0]).toMatchObject({
      projectName: 'alpha',
      repoPath,
      repoKind: 'standard',
      workspaceName: 'main',
      workspacePath: repoPath,
      moduleCount: 1,
      status: 'synced',
      errorTag: null,
    })
    expect([null, 'tmux_not_found']).toContain(result.projects[0]?.runtimeIssue ?? null)

    const database = await openDatabase(dbPath)
    try {
      const project = await database.db.query.projects.findFirst({
        where: (projectRow, { eq }) => eq(projectRow.name, 'alpha'),
      })
      expect(project?.repoPath).toBe(repoPath)
    } finally {
      database.sqlite.close()
    }
  })

  it('persists project only when bare repo has no linked workspace', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo.git')
    const configPath = path.join(tempRoot, 'harbour.json')
    const dbPath = path.join(tempRoot, 'harbour.db')

    await execFileAsync('git', ['init', '--bare', repoPath])
    await writeFile(
      configPath,
      JSON.stringify({
        projects: [
          {
            name: 'alpha',
            repo: repoPath,
            modules: ['docs'],
          },
        ],
      }),
      'utf8',
    )

    const result = await Effect.runPromise(refreshProject('alpha', { configPath, dbPath }))

    expect(result).toMatchObject({
      projectName: 'alpha',
      repoPath,
      repoKind: 'bare',
      workspaceName: null,
      workspacePath: null,
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
    const configPath = path.join(tempRoot, 'harbour.json')
    const dbPath = path.join(tempRoot, 'harbour.db')

    await execFileAsync('git', ['init', repoPath])
    await mkdir(path.join(repoPath, 'docs'), { recursive: true })
    await mkdir(plainDirPath, { recursive: true })
    await writeFile(
      configPath,
      JSON.stringify({
        projects: [
          {
            name: 'alpha',
            repo: repoPath,
            modules: ['docs'],
          },
          {
            name: 'beta',
            repo: plainDirPath,
            modules: ['docs'],
          },
        ],
      }),
      'utf8',
    )

    const result = await Effect.runPromise(sync({ configPath, dbPath }))

    expect(result.projects).toHaveLength(2)
    expect(result.projects[0]).toMatchObject({
      projectName: 'alpha',
      repoPath,
      repoKind: 'standard',
      workspaceName: 'main',
      workspacePath: repoPath,
      moduleCount: 1,
      status: 'synced',
      errorTag: null,
    })
    expect([null, 'tmux_not_found']).toContain(result.projects[0]?.runtimeIssue ?? null)
    expect(result.projects[1]).toEqual({
      projectName: 'beta',
      repoPath: plainDirPath,
      repoKind: null,
      workspaceName: null,
      workspacePath: null,
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

    const config: HarbourConfig = {
      configPath: '/tmp/harbour.json',
      projects: [alpha, beta],
    }

    const layer = ReconcilerServiceLive.pipe(
      Layer.provide(
        Layer.succeed(ConfigService, {
          load: Effect.succeed(config),
          loadAtPath: () => Effect.succeed(config),
        }),
      ),
      Layer.provide(
        Layer.succeed(ScannerService, {
          observeProject: (project: ProjectConfig) =>
            project.name === 'alpha'
              ? Effect.succeed(createObservation(project))
              : Effect.fail(new RepoNotGitError({ repoPath: project.repo })),
        }),
      ),
      Layer.provide(
        Layer.succeed(ProjectService, {
          findByName: () => Effect.succeed(null),
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
                workspace: input.workspacePath
                  ? {
                    id: `${input.projectName}-workspace`,
                    projectId: input.projectName,
                    name: input.workspaceName ?? 'main',
                    workspacePath: input.workspacePath,
                    createdAt: 0,
                    updatedAt: 0,
                  }
                : null,
                modules: [],
                runtimes: [],
              })
            },
          }),
      ),
    )

    await expect(
      Effect.runPromise(
        syncProgram.pipe(Effect.provide(layer)),
      ),
    ).resolves.toEqual({
      projects: [
        {
          projectName: 'alpha',
          repoPath: '/tmp/alpha.git',
          repoKind: 'standard',
          workspaceName: 'main',
          workspacePath: '/tmp/alpha-main',
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
          workspaceName: null,
          workspacePath: null,
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

  it('returns tagged project_not_found from provided services', async () => {
    const config: HarbourConfig = {
      configPath: '/tmp/harbour.json',
      projects: [createProjectConfig('alpha')],
    }

    const layer = ReconcilerServiceLive.pipe(
      Layer.provide(
        Layer.succeed(ConfigService, {
          load: Effect.succeed(config),
          loadAtPath: () => Effect.succeed(config),
        }),
      ),
      Layer.provide(
        Layer.succeed(ScannerService, {
          observeProject: () => Effect.die('not used'),
        }),
      ),
      Layer.provide(
        Layer.succeed(ProjectService, {
          findByName: () => Effect.succeed(null),
          syncSnapshot: () => Effect.die('not used'),
        }),
      ),
    )

    const result = await Effect.runPromise(
      Effect.either(
        refreshProjectProgram('missing').pipe(Effect.provide(layer)),
      ),
    )

    expect(Either.isLeft(result)).toBe(true)
    if (!Either.isLeft(result)) {
      return
    }

    expect(result.left).toBeInstanceOf(ProjectNotFoundError)
    expect(result.left).toEqual(new ProjectNotFoundError({ projectName: 'missing' }))
  })
})

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(tmpdir(), 'harbour-reconciler-'))
  tempRoots.push(tempRoot)
  return tempRoot
}

function createProjectConfig(name: string): ProjectConfig {
  return {
    name,
    repo: `/tmp/${name}.git`,
    modules: [{ raw: 'apps/', path: 'apps', mode: 'children' }],
  }
}

function createObservation(project: ProjectConfig): ProjectObservation {
  return {
    projectName: project.name,
    repoPath: project.repo,
    repoKind: 'standard',
    workspaceName: 'main',
    workspacePath: `/tmp/${project.name}-main`,
    modules: [
      {
        name: 'apps/cli',
        path: 'apps/cli',
        workspacePath: `/tmp/${project.name}-main/apps/cli`,
        selector: { raw: 'apps/', path: 'apps', mode: 'children' },
      },
    ],
    runtimes: [],
    runtimeIssue: 'tmux_not_found',
  }
}
