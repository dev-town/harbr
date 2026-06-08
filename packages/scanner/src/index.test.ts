import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import type { ProjectConfig } from '@harbour/domain'
import { GitService, type GitServiceApi } from '@harbour/git'
import {
  RuntimeTmuxService,
  type RuntimeTmuxServiceApi,
} from '@harbour/runtime-tmux'
import { Effect, Layer } from 'effect'
import { afterEach, describe, expect, it } from 'vitest'

import {
  ScannerService,
  ScannerServiceLive,
  observeProject,
  resolveProjectModules,
  scanProject,
} from './index'

const execFileAsync = promisify(execFile)
const tempRoots: string[] = []

afterEach(async () => {
  await Promise.all(
    tempRoots
      .splice(0)
      .map((tempRoot) => rm(tempRoot, { force: true, recursive: true })),
  )
})

describe('resolveProjectModules', () => {
  it('resolves explicit selectors as one module', async () => {
    const tempRoot = await createTempRoot()
    const workspacePath = path.join(tempRoot, 'workspace')

    await mkdir(workspacePath, { recursive: true })

    const project = createProject([
      { raw: 'apps', path: 'apps', mode: 'explicit' },
    ])

    await expect(
      runSuccess(resolveProjectModules(project, workspacePath)),
    ).resolves.toEqual([
      {
        name: 'apps',
        path: 'apps',
        workspacePath: path.join(workspacePath, 'apps'),
        selector: { raw: 'apps', path: 'apps', mode: 'explicit' },
      },
    ])
  })

  it('resolves root selectors to workspace root', async () => {
    const tempRoot = await createTempRoot()
    const workspacePath = path.join(tempRoot, 'workspace')

    await mkdir(workspacePath, { recursive: true })

    const project = createProject([{ raw: '.', path: '.', mode: 'explicit' }])

    await expect(
      runSuccess(resolveProjectModules(project, workspacePath)),
    ).resolves.toEqual([
      {
        name: '/',
        path: '.',
        workspacePath,
        selector: { raw: '.', path: '.', mode: 'explicit' },
      },
    ])
  })

  it('expands children selectors to immediate child dirs only', async () => {
    const tempRoot = await createTempRoot()
    const workspacePath = path.join(tempRoot, 'workspace')

    await mkdir(path.join(workspacePath, 'apps', 'cli'), { recursive: true })
    await mkdir(path.join(workspacePath, 'apps', 'tui'), { recursive: true })
    await mkdir(path.join(workspacePath, 'apps', 'cli', 'nested'), {
      recursive: true,
    })
    await writeFile(
      path.join(workspacePath, 'apps', 'README.md'),
      'docs\n',
      'utf8',
    )

    const project = createProject([
      { raw: 'apps/', path: 'apps', mode: 'children' },
    ])

    await expect(
      runSuccess(resolveProjectModules(project, workspacePath)),
    ).resolves.toEqual([
      {
        name: 'apps/cli',
        path: 'apps/cli',
        workspacePath: path.join(workspacePath, 'apps', 'cli'),
        selector: { raw: 'apps/', path: 'apps', mode: 'children' },
      },
      {
        name: 'apps/tui',
        path: 'apps/tui',
        workspacePath: path.join(workspacePath, 'apps', 'tui'),
        selector: { raw: 'apps/', path: 'apps', mode: 'children' },
      },
    ])
  })

  it('uses workspace path instead of repo path', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo.git')
    const workspacePath = path.join(tempRoot, 'workspace')

    await mkdir(repoPath, { recursive: true })
    await mkdir(path.join(workspacePath, 'packages', 'config'), {
      recursive: true,
    })
    await mkdir(path.join(workspacePath, 'packages', 'git'), {
      recursive: true,
    })

    const project: ProjectConfig = {
      name: 'alpha',
      repo: repoPath,
      modules: [{ raw: 'packages/', path: 'packages', mode: 'children' }],
    }

    await expect(
      runSuccess(resolveProjectModules(project, workspacePath)),
    ).resolves.toEqual([
      {
        name: 'packages/config',
        path: 'packages/config',
        workspacePath: path.join(workspacePath, 'packages', 'config'),
        selector: { raw: 'packages/', path: 'packages', mode: 'children' },
      },
      {
        name: 'packages/git',
        path: 'packages/git',
        workspacePath: path.join(workspacePath, 'packages', 'git'),
        selector: { raw: 'packages/', path: 'packages', mode: 'children' },
      },
    ])
  })

  it('returns no modules when child selector dir is missing', async () => {
    const tempRoot = await createTempRoot()
    const workspacePath = path.join(tempRoot, 'workspace')

    await mkdir(workspacePath, { recursive: true })

    const project = createProject([
      { raw: 'packages/', path: 'packages', mode: 'children' },
    ])

    await expect(
      runSuccess(resolveProjectModules(project, workspacePath)),
    ).resolves.toEqual([])
  })
})

describe('scanProject', () => {
  it('wires project metadata and resolved modules into one scan result', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const workspacePath = path.join(tempRoot, 'workspace')

    await mkdir(repoPath, { recursive: true })
    await mkdir(path.join(workspacePath, 'apps', 'cli'), { recursive: true })

    const project: ProjectConfig = {
      name: 'alpha',
      repo: repoPath,
      modules: [{ raw: 'apps/', path: 'apps', mode: 'children' }],
    }

    await expect(runScan(scanProject(project, workspacePath))).resolves.toEqual(
      {
        projectName: 'alpha',
        repoPath,
        workspacePath,
        modules: [
          {
            name: 'apps/cli',
            path: 'apps/cli',
            workspacePath: path.join(workspacePath, 'apps', 'cli'),
            selector: { raw: 'apps/', path: 'apps', mode: 'children' },
          },
        ],
      },
    )
  })

  it('includes root module labels in scan output', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const workspacePath = path.join(tempRoot, 'workspace')

    await mkdir(repoPath, { recursive: true })

    const project: ProjectConfig = {
      name: 'alpha',
      repo: repoPath,
      modules: [{ raw: '.', path: '.', mode: 'explicit' }],
    }

    await expect(runScan(scanProject(project, workspacePath))).resolves.toEqual(
      {
        projectName: 'alpha',
        repoPath,
        workspacePath,
        modules: [
          {
            name: '/',
            path: '.',
            workspacePath,
            selector: { raw: '.', path: '.', mode: 'explicit' },
          },
        ],
      },
    )
  })
})

describe('observeProject', () => {
  it('observes standard repos through git and scanner', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')

    await execFileAsync('git', ['init', '-b', 'main', repoPath])
    await mkdir(path.join(repoPath, 'apps', 'cli'), { recursive: true })

    const project: ProjectConfig = {
      name: 'alpha',
      repo: repoPath,
      modules: [{ raw: 'apps/', path: 'apps', mode: 'children' }],
    }

    const observation = await runObservation(observeProject(project))

    expect(observation).toMatchObject({
      projectIssue: null,
      projectName: 'alpha',
      repoPath,
      repoKind: 'standard',
      workspaces: [
        {
          branchName: 'main',
          workspaceName: 'main',
          workspacePath: repoPath,
          kind: 'default',
          modules: [
            {
              name: 'apps/cli',
              path: 'apps/cli',
              workspacePath: path.join(repoPath, 'apps', 'cli'),
              selector: { raw: 'apps/', path: 'apps', mode: 'children' },
            },
          ],
        },
      ],
    })
    expect([null, 'tmux_not_found']).toContain(observation.runtimeIssue)
  })

  it('can run against a provided git service layer', async () => {
    const project: ProjectConfig = {
      name: 'alpha',
      repo: '/tmp/alpha.git',
      modules: [{ raw: 'apps', path: 'apps', mode: 'explicit' }],
    }

    const git: GitServiceApi = {
      createWorktree: () => Effect.die('not used'),
      getDefaultBranch: () => Effect.die('not used'),
      getDefaultBranchIssue: () => Effect.succeed(null),
      inspectRepo: () =>
        Effect.succeed({
          repoPath: '/tmp/alpha.git',
          kind: 'bare',
        }),
      listWorkspaces: () => Effect.succeed([]),
      resolveWorkspacePath: () => Effect.succeed(null),
    }

    const runtimeTmux: RuntimeTmuxServiceApi = {
      closeRuntime: () => Effect.die('not used'),
      createRuntimeWindows: () => Effect.die('not used'),
      getCurrentRuntime: Effect.succeed(null),
      listRuntimes: Effect.succeed({
        runtimes: [
          {
            sessionName: 'alpha',
            scope: 'project',
            projectName: 'alpha',
            workspaceName: null,
            moduleName: null,
            status: 'open',
          },
        ],
        runtimeIssue: 'tmux_not_found',
      }),
      openOrCreateRuntime: () => Effect.void,
    }

    await expect(
      Effect.runPromise(
        Effect.flatMap(ScannerService, (service) =>
          service.observeProject(project),
        ).pipe(
          Effect.provide(
            ScannerServiceLive.pipe(
              Layer.provide(Layer.succeed(RuntimeTmuxService, runtimeTmux)),
              Layer.provide(Layer.succeed(GitService, git)),
            ),
          ),
        ),
      ),
    ).resolves.toEqual({
      projectIssue: null,
      projectName: 'alpha',
      repoPath: '/tmp/alpha.git',
      repoKind: 'bare',
      workspaces: [],
      runtimes: [
        {
          sessionName: 'alpha',
          scope: 'project',
          projectName: 'alpha',
          workspaceName: null,
          moduleName: null,
          status: 'open',
        },
      ],
      runtimeIssue: 'tmux_not_found',
    })
  })

  it('maps matching workspace and module runtimes', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')

    await execFileAsync('git', ['init', '-b', 'main', repoPath])
    await mkdir(path.join(repoPath, 'apps', 'cli'), { recursive: true })

    const project: ProjectConfig = {
      name: 'alpha',
      repo: repoPath,
      modules: [{ raw: 'apps/', path: 'apps', mode: 'children' }],
    }

    const runtimeTmux: RuntimeTmuxServiceApi = {
      closeRuntime: () => Effect.die('not used'),
      createRuntimeWindows: () => Effect.die('not used'),
      getCurrentRuntime: Effect.succeed(null),
      listRuntimes: Effect.succeed({
        runtimes: [
          {
            sessionName: 'alpha',
            scope: 'project',
            projectName: 'alpha',
            workspaceName: null,
            moduleName: null,
            status: 'open',
          },
          {
            sessionName: 'alpha__main',
            scope: 'workspace',
            projectName: 'alpha',
            workspaceName: 'main',
            moduleName: null,
            status: 'open',
          },
          {
            sessionName: 'alpha__main__apps/cli',
            scope: 'module',
            projectName: 'alpha',
            workspaceName: 'main',
            moduleName: 'apps/cli',
            status: 'open',
          },
          {
            sessionName: 'alpha__main__apps/tui',
            scope: 'module',
            projectName: 'alpha',
            workspaceName: 'main',
            moduleName: 'apps/tui',
            status: 'open',
          },
        ],
        runtimeIssue: null,
      }),
      openOrCreateRuntime: () => Effect.void,
    }

    await expect(
      Effect.runPromise(
        Effect.flatMap(ScannerService, (service) =>
          service.observeProject(project),
        ).pipe(
          Effect.provide(
            ScannerServiceLive.pipe(
              Layer.provide(Layer.succeed(RuntimeTmuxService, runtimeTmux)),
              Layer.provide(
                Layer.succeed(GitService, {
                  createWorktree: () => Effect.die('not used'),
                  getDefaultBranch: () => Effect.die('not used'),
                  getDefaultBranchIssue: () => Effect.succeed(null),
                  inspectRepo: () =>
                    Effect.succeed({
                      repoPath,
                      kind: 'standard',
                    }),
                  listWorkspaces: () =>
                    Effect.succeed([
                      {
                        branchName: 'main',
                        name: 'main',
                        path: repoPath,
                        kind: 'default',
                      },
                    ]),
                  resolveWorkspacePath: () => Effect.succeed(repoPath),
                }),
              ),
            ),
          ),
        ),
      ),
    ).resolves.toEqual({
      projectIssue: null,
      projectName: 'alpha',
      repoPath,
      repoKind: 'standard',
      workspaces: [
        {
          branchName: 'main',
          workspaceName: 'main',
          workspacePath: repoPath,
          kind: 'default',
          modules: [
            {
              name: 'apps/cli',
              path: 'apps/cli',
              workspacePath: path.join(repoPath, 'apps', 'cli'),
              selector: { raw: 'apps/', path: 'apps', mode: 'children' },
            },
          ],
        },
      ],
      runtimes: [
        {
          sessionName: 'alpha',
          scope: 'project',
          projectName: 'alpha',
          workspaceName: null,
          moduleName: null,
          status: 'open',
        },
        {
          sessionName: 'alpha__main',
          scope: 'workspace',
          projectName: 'alpha',
          workspaceName: 'main',
          moduleName: null,
          status: 'open',
        },
        {
          sessionName: 'alpha__main__apps/cli',
          scope: 'module',
          projectName: 'alpha',
          workspaceName: 'main',
          moduleName: 'apps/cli',
          status: 'open',
        },
      ],
      runtimeIssue: null,
    })
  })

  it('keeps root module runtimes when slash module exists', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')

    await execFileAsync('git', ['init', '-b', 'main', repoPath])

    const project: ProjectConfig = {
      name: 'alpha',
      repo: repoPath,
      modules: [{ raw: '.', path: '.', mode: 'explicit' }],
    }

    const runtimeTmux: RuntimeTmuxServiceApi = {
      closeRuntime: () => Effect.die('not used'),
      createRuntimeWindows: () => Effect.die('not used'),
      getCurrentRuntime: Effect.succeed(null),
      listRuntimes: Effect.succeed({
        runtimes: [
          {
            sessionName: 'alpha~~main',
            scope: 'workspace',
            projectName: 'alpha',
            workspaceName: 'main',
            moduleName: null,
            status: 'open',
          },
          {
            sessionName: 'alpha~~main~~/',
            scope: 'module',
            projectName: 'alpha',
            workspaceName: 'main',
            moduleName: '/',
            status: 'open',
          },
        ],
        runtimeIssue: null,
      }),
      openOrCreateRuntime: () => Effect.void,
    }

    await expect(
      Effect.runPromise(
        Effect.flatMap(ScannerService, (service) =>
          service.observeProject(project),
        ).pipe(
          Effect.provide(
            ScannerServiceLive.pipe(
              Layer.provide(Layer.succeed(RuntimeTmuxService, runtimeTmux)),
              Layer.provide(
                Layer.succeed(GitService, {
                  createWorktree: () => Effect.die('not used'),
                  getDefaultBranch: () => Effect.die('not used'),
                  getDefaultBranchIssue: () => Effect.succeed(null),
                  inspectRepo: () =>
                    Effect.succeed({
                      repoPath,
                      kind: 'standard',
                    }),
                  listWorkspaces: () =>
                    Effect.succeed([
                      {
                        branchName: 'main',
                        name: 'main',
                        path: repoPath,
                        kind: 'default',
                      },
                    ]),
                  resolveWorkspacePath: () => Effect.succeed(repoPath),
                }),
              ),
            ),
          ),
        ),
      ),
    ).resolves.toEqual({
      projectIssue: null,
      projectName: 'alpha',
      repoPath,
      repoKind: 'standard',
      workspaces: [
        {
          branchName: 'main',
          workspaceName: 'main',
          workspacePath: repoPath,
          kind: 'default',
          modules: [
            {
              name: '/',
              path: '.',
              workspacePath: repoPath,
              selector: { raw: '.', path: '.', mode: 'explicit' },
            },
          ],
        },
      ],
      runtimes: [
        {
          sessionName: 'alpha~~main',
          scope: 'workspace',
          projectName: 'alpha',
          workspaceName: 'main',
          moduleName: null,
          status: 'open',
        },
        {
          sessionName: 'alpha~~main~~/',
          scope: 'module',
          projectName: 'alpha',
          workspaceName: 'main',
          moduleName: '/',
          status: 'open',
        },
      ],
      runtimeIssue: null,
    })
  })
})

async function runSuccess(effect: ReturnType<typeof resolveProjectModules>) {
  return Effect.runPromise(effect)
}

async function runScan(effect: ReturnType<typeof scanProject>) {
  return Effect.runPromise(effect)
}

async function runObservation(effect: ReturnType<typeof observeProject>) {
  return Effect.runPromise(effect)
}

function createProject(modules: ProjectConfig['modules']): ProjectConfig {
  return {
    name: 'alpha',
    repo: '/tmp/repo',
    modules,
  }
}

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(tmpdir(), 'harbour-scanner-'))
  tempRoots.push(tempRoot)
  return tempRoot
}
