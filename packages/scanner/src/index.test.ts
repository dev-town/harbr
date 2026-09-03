import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import type { ProjectConfig } from '@harbr/domain'
import { GitService, GitServiceLive, type GitServiceApi } from '@harbr/git'
import {
  RuntimeDiscoveryService,
  type RuntimeDiscoveryServiceApi,
} from '@harbr/runtime/discovery'
import { Effect, Layer } from 'effect'
import { afterEach, describe, expect, it } from 'vitest'

import {
  detectWorkspaceProvider,
  ScannerService,
  ScannerServiceLive,
  resolveProjectModules,
  scanProject,
} from './index'

const execFileAsync = promisify(execFile)
const tempRoots: string[] = []
const runtimeSource = { provider: 'tmux', sourceId: 'test' }

function runtimeIdentity(externalId: string) {
  return { displayLabel: externalId, externalId, source: runtimeSource }
}

function pathRuntime(
  externalId: string,
  contextPath: string,
  source: { provider: string; sourceId: string },
) {
  return {
    contextPath,
    identity: { displayLabel: externalId, externalId, source },
    status: 'open' as const,
  }
}

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

describe('detectWorkspaceProvider', () => {
  const homePath = '/Users/tester'

  it.each([
    {
      expected: 'harbr',
      workspacePath:
        '/Users/tester/.local/share/harbr/worktrees/devtown/feature-auth',
    },
    {
      expected: 'codex',
      workspacePath: '/Users/tester/.codex/worktrees/1918/main',
    },
    {
      expected: 'claude',
      workspacePath: '/Users/tester/.claude/worktrees/devtown/feature-auth',
    },
    {
      expected: 'opencode',
      workspacePath:
        '/Users/tester/.local/share/opencode/worktree/project-id/feature-auth',
    },
    {
      expected: 'amp',
      workspacePath: '/Users/tester/projects/devtown-worktrees/feature-auth',
    },
    {
      expected: 'amp',
      workspacePath: '/Users/tester/projects/devtown-feature-auth',
    },
  ])('detects $expected managed worktrees', ({ expected, workspacePath }) => {
    expect(
      detectWorkspaceProvider({
        branchName: 'feature/auth',
        homePath,
        kind: 'worktree',
        repoPath: '/Users/tester/projects/devtown',
        workspacePath,
      }),
    ).toBe(expected)
  })

  it('classifies the primary checkout as local', () => {
    expect(
      detectWorkspaceProvider({
        branchName: 'main',
        homePath,
        kind: 'default',
        repoPath: '/Users/tester/projects/devtown',
        workspacePath: '/Users/tester/projects/devtown',
      }),
    ).toBe('local')
  })

  it.each([
    '/Users/tester/worktrees/devtown/feature-auth',
    '/Users/tester/projects/devtown-unrelated',
    '/Users/tester/.local/share/unknown/worktree/devtown/feature-auth',
  ])('falls back to external for %s', (workspacePath) => {
    expect(
      detectWorkspaceProvider({
        branchName: 'feature/auth',
        homePath,
        kind: 'worktree',
        repoPath: '/Users/tester/projects/devtown',
        workspacePath,
      }),
    ).toBe('external')
  })

  it('does not classify an Amp-style directory without matching branch context', () => {
    expect(
      detectWorkspaceProvider({
        branchName: 'fix/payments',
        homePath,
        kind: 'worktree',
        repoPath: '/Users/tester/projects/devtown.git',
        workspacePath: '/Users/tester/projects/devtown-feature-auth',
      }),
    ).toBe('external')
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
          workspaceProvider: 'local',
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
    expect([null, 'provider_not_found']).toContain(
      observation.runtimeIssue?.code ?? null,
    )
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

    const runtimeDiscovery: RuntimeDiscoveryServiceApi = {
      listRuntimes: Effect.succeed({
        runtimes: [
          {
            identity: runtimeIdentity('alpha'),
            scope: 'project',
            projectName: 'alpha',
            workspaceName: null,
            moduleName: null,
            status: 'open',
          },
        ],
        runtimeIssue: { code: 'provider_not_found', source: runtimeSource },
        source: runtimeSource,
      }),
    }

    await expect(
      Effect.runPromise(
        Effect.flatMap(ScannerService, (service) =>
          service.observeProject(project),
        ).pipe(
          Effect.provide(
            ScannerServiceLive.pipe(
              Layer.provide(
                Layer.succeed(RuntimeDiscoveryService, runtimeDiscovery),
              ),
              Layer.provide(Layer.succeed(GitService, git)),
            ),
          ),
        ),
      ),
    ).resolves.toEqual({
      observedRuntimes: [
        {
          identity: runtimeIdentity('alpha'),
          status: 'open',
        },
      ],
      projectIssue: null,
      projectName: 'alpha',
      repoPath: '/tmp/alpha.git',
      repoKind: 'bare',
      workspaces: [],
      runtimes: [
        {
          identity: runtimeIdentity('alpha'),
          scope: 'project',
          projectName: 'alpha',
          workspaceName: null,
          moduleName: null,
          status: 'open',
        },
      ],
      runtimeIssue: { code: 'provider_not_found', source: runtimeSource },
      runtimeSource,
    })
  })

  it('observes configured projects concurrently while preserving result order', async () => {
    const projects: ProjectConfig[] = [
      { name: 'alpha', repo: '/tmp/alpha.git', modules: [] },
      { name: 'beta', repo: '/tmp/beta.git', modules: [] },
      { name: 'gamma', repo: '/tmp/gamma.git', modules: [] },
    ]
    let activeInspections = 0
    let maxActiveInspections = 0

    const git: GitServiceApi = {
      createWorktree: () => Effect.die('not used'),
      getDefaultBranch: () => Effect.die('not used'),
      getDefaultBranchIssue: () => Effect.succeed(null),
      inspectRepo: (repoPath) =>
        Effect.gen(function* () {
          activeInspections += 1
          maxActiveInspections = Math.max(
            maxActiveInspections,
            activeInspections,
          )
          yield* Effect.sleep('20 millis')
          activeInspections -= 1

          return {
            repoPath,
            kind: 'bare',
          } as const
        }),
      listWorkspaces: () => Effect.succeed([]),
      resolveWorkspacePath: () => Effect.succeed(null),
    }
    const runtimeDiscovery: RuntimeDiscoveryServiceApi = {
      listRuntimes: Effect.succeed({
        runtimes: [],
        runtimeIssue: null,
        source: runtimeSource,
      }),
    }

    const observations = await Effect.runPromise(
      Effect.flatMap(ScannerService, (service) =>
        service.observeProjects(projects),
      ).pipe(
        Effect.provide(
          ScannerServiceLive.pipe(
            Layer.provide(
              Layer.succeed(RuntimeDiscoveryService, runtimeDiscovery),
            ),
            Layer.provide(Layer.succeed(GitService, git)),
          ),
        ),
      ),
    )

    expect(maxActiveInspections).toBeGreaterThan(1)
    expect(observations.map((observation) => observation.project.name)).toEqual(
      ['alpha', 'beta', 'gamma'],
    )
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

    const runtimeDiscovery: RuntimeDiscoveryServiceApi = {
      listRuntimes: Effect.succeed({
        runtimes: [
          {
            identity: runtimeIdentity('alpha'),
            scope: 'project',
            projectName: 'alpha',
            workspaceName: null,
            moduleName: null,
            status: 'open',
          },
          {
            identity: runtimeIdentity('alpha__main'),
            scope: 'workspace',
            projectName: 'alpha',
            workspaceName: 'main',
            moduleName: null,
            status: 'open',
          },
          {
            identity: runtimeIdentity('alpha__main__apps/cli'),
            scope: 'module',
            projectName: 'alpha',
            workspaceName: 'main',
            moduleName: 'apps/cli',
            status: 'open',
          },
          {
            identity: runtimeIdentity('alpha__main__apps/tui'),
            scope: 'module',
            projectName: 'alpha',
            workspaceName: 'main',
            moduleName: 'apps/tui',
            status: 'open',
          },
        ],
        runtimeIssue: null,
        source: runtimeSource,
      }),
    }

    await expect(
      Effect.runPromise(
        Effect.flatMap(ScannerService, (service) =>
          service.observeProject(project),
        ).pipe(
          Effect.provide(
            ScannerServiceLive.pipe(
              Layer.provide(
                Layer.succeed(RuntimeDiscoveryService, runtimeDiscovery),
              ),
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
      observedRuntimes: [
        {
          identity: runtimeIdentity('alpha'),
          status: 'open',
        },
        {
          identity: runtimeIdentity('alpha__main'),
          status: 'open',
        },
        {
          identity: runtimeIdentity('alpha__main__apps/cli'),
          status: 'open',
        },
        {
          identity: runtimeIdentity('alpha__main__apps/tui'),
          status: 'open',
        },
      ],
      projectIssue: null,
      projectName: 'alpha',
      repoPath,
      repoKind: 'standard',
      workspaces: [
        {
          branchName: 'main',
          workspaceName: 'main',
          workspacePath: repoPath,
          workspaceProvider: 'local',
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
          identity: runtimeIdentity('alpha'),
          scope: 'project',
          projectName: 'alpha',
          workspaceName: null,
          moduleName: null,
          status: 'open',
        },
        {
          identity: runtimeIdentity('alpha__main'),
          scope: 'workspace',
          projectName: 'alpha',
          workspaceName: 'main',
          moduleName: null,
          status: 'open',
        },
        {
          identity: runtimeIdentity('alpha__main__apps/cli'),
          scope: 'module',
          projectName: 'alpha',
          workspaceName: 'main',
          moduleName: 'apps/cli',
          status: 'open',
        },
      ],
      runtimeIssue: null,
      runtimeSource,
    })
  })

  it('preserves workspace paths when runtime workspace names collide', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'alpha.git')
    const firstWorkspacePath = path.join(tempRoot, 'first', 'main')
    const secondWorkspacePath = path.join(tempRoot, 'second', 'main')

    await mkdir(firstWorkspacePath, { recursive: true })
    await mkdir(secondWorkspacePath, { recursive: true })

    const project: ProjectConfig = {
      name: 'alpha',
      repo: repoPath,
      modules: [],
    }
    const git: GitServiceApi = {
      createWorktree: () => Effect.die('not used'),
      getDefaultBranch: () => Effect.die('not used'),
      getDefaultBranchIssue: () => Effect.succeed(null),
      inspectRepo: () => Effect.succeed({ repoPath, kind: 'bare' }),
      listWorkspaces: () =>
        Effect.succeed([
          {
            branchName: null,
            kind: 'worktree',
            name: 'main',
            path: firstWorkspacePath,
          },
          {
            branchName: null,
            kind: 'worktree',
            name: 'main',
            path: secondWorkspacePath,
          },
        ]),
      resolveWorkspacePath: () => Effect.succeed(null),
    }
    const runtimeDiscovery: RuntimeDiscoveryServiceApi = {
      listRuntimes: Effect.succeed({
        runtimes: [
          pathRuntime('first-main', firstWorkspacePath, runtimeSource),
          pathRuntime('second-main', secondWorkspacePath, runtimeSource),
        ],
        runtimeIssue: null,
        source: runtimeSource,
      }),
    }

    const observation = await Effect.runPromise(
      Effect.flatMap(ScannerService, (service) =>
        service.observeProject(project),
      ).pipe(
        Effect.provide(
          ScannerServiceLive.pipe(
            Layer.provide(
              Layer.succeed(RuntimeDiscoveryService, runtimeDiscovery),
            ),
            Layer.provide(Layer.succeed(GitService, git)),
          ),
        ),
      ),
    )

    expect(
      observation.runtimes.map((runtime) => ({
        externalId: runtime.identity.externalId,
        workspaceName: runtime.workspaceName,
        workspacePath: runtime.workspacePath,
      })),
    ).toEqual([
      {
        externalId: 'first-main',
        workspaceName: 'main',
        workspacePath: firstWorkspacePath,
      },
      {
        externalId: 'second-main',
        workspaceName: 'main',
        workspacePath: secondWorkspacePath,
      },
    ])
  })

  it('maps Herdr paths to project, worktree, and module contexts', async () => {
    const tempRoot = await createTempRoot()
    const repoPath = path.join(tempRoot, 'repo')
    const featurePath = path.join(tempRoot, 'feature')
    const modulePath = path.join(featurePath, 'apps', 'cli')

    await mkdir(path.join(repoPath, 'apps', 'cli'), { recursive: true })
    await mkdir(modulePath, { recursive: true })

    const project: ProjectConfig = {
      name: 'alpha',
      repo: repoPath,
      modules: [{ raw: 'apps/', path: 'apps', mode: 'children' }],
    }
    const herdrSource = { provider: 'herdr', sourceId: '/tmp/herdr.sock' }
    const runtimeDiscovery: RuntimeDiscoveryServiceApi = {
      listRuntimes: Effect.succeed({
        runtimes: [
          pathRuntime('project', repoPath, herdrSource),
          pathRuntime('workspace', featurePath, herdrSource),
          pathRuntime('module', modulePath, herdrSource),
          pathRuntime('unmapped', '/tmp/elsewhere', herdrSource),
        ],
        runtimeIssue: null,
        source: herdrSource,
      }),
    }
    const git: GitServiceApi = {
      createWorktree: () => Effect.die('not used'),
      getDefaultBranch: () => Effect.die('not used'),
      getDefaultBranchIssue: () => Effect.succeed(null),
      inspectRepo: () => Effect.succeed({ repoPath, kind: 'standard' }),
      listWorkspaces: () =>
        Effect.succeed([
          {
            branchName: 'main',
            name: 'main',
            path: repoPath,
            kind: 'default',
          },
          {
            branchName: 'feature',
            name: 'feature',
            path: featurePath,
            kind: 'worktree',
          },
        ]),
      resolveWorkspacePath: () => Effect.succeed(repoPath),
    }

    const observation = await Effect.runPromise(
      Effect.flatMap(ScannerService, (service) =>
        service.observeProject(project),
      ).pipe(
        Effect.provide(
          ScannerServiceLive.pipe(
            Layer.provide(
              Layer.succeed(RuntimeDiscoveryService, runtimeDiscovery),
            ),
            Layer.provide(Layer.succeed(GitService, git)),
          ),
        ),
      ),
    )

    expect(observation.runtimes).toEqual([
      expect.objectContaining({
        projectName: 'alpha',
        scope: 'project',
        workspaceName: null,
      }),
      expect.objectContaining({
        projectName: 'alpha',
        scope: 'workspace',
        workspaceName: 'feature',
      }),
      expect.objectContaining({
        moduleName: 'apps/cli',
        projectName: 'alpha',
        scope: 'module',
        workspaceName: 'feature',
      }),
    ])
    expect(observation.runtimeSource).toEqual(herdrSource)
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

    const runtimeDiscovery: RuntimeDiscoveryServiceApi = {
      listRuntimes: Effect.succeed({
        runtimes: [
          {
            identity: runtimeIdentity('alpha~~main'),
            scope: 'workspace',
            projectName: 'alpha',
            workspaceName: 'main',
            moduleName: null,
            status: 'open',
          },
          {
            identity: runtimeIdentity('alpha~~main~~/'),
            scope: 'module',
            projectName: 'alpha',
            workspaceName: 'main',
            moduleName: '/',
            status: 'open',
          },
        ],
        runtimeIssue: null,
        source: runtimeSource,
      }),
    }

    await expect(
      Effect.runPromise(
        Effect.flatMap(ScannerService, (service) =>
          service.observeProject(project),
        ).pipe(
          Effect.provide(
            ScannerServiceLive.pipe(
              Layer.provide(
                Layer.succeed(RuntimeDiscoveryService, runtimeDiscovery),
              ),
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
      observedRuntimes: [
        {
          identity: runtimeIdentity('alpha~~main'),
          status: 'open',
        },
        {
          identity: runtimeIdentity('alpha~~main~~/'),
          status: 'open',
        },
      ],
      projectIssue: null,
      projectName: 'alpha',
      repoPath,
      repoKind: 'standard',
      workspaces: [
        {
          branchName: 'main',
          workspaceName: 'main',
          workspacePath: repoPath,
          workspaceProvider: 'local',
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
          identity: runtimeIdentity('alpha~~main'),
          scope: 'workspace',
          projectName: 'alpha',
          workspaceName: 'main',
          moduleName: null,
          status: 'open',
        },
        {
          identity: runtimeIdentity('alpha~~main~~/'),
          scope: 'module',
          projectName: 'alpha',
          workspaceName: 'main',
          moduleName: '/',
          status: 'open',
        },
      ],
      runtimeIssue: null,
      runtimeSource,
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
  const runtimeDiscovery: RuntimeDiscoveryServiceApi = {
    listRuntimes: Effect.succeed({
      runtimes: [],
      runtimeIssue: null,
      source: runtimeSource,
    }),
  }

  return Effect.runPromise(
    effect.pipe(
      Effect.provide(
        ScannerServiceLive.pipe(
          Layer.provide(GitServiceLive),
          Layer.provide(
            Layer.succeed(RuntimeDiscoveryService, runtimeDiscovery),
          ),
        ),
      ),
    ),
  )
}

function observeProject(project: ProjectConfig) {
  return Effect.flatMap(ScannerService, (service) =>
    service.observeProject(project),
  )
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
