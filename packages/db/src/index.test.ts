import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { eq } from 'drizzle-orm'
import { afterEach, describe, expect, it } from 'vitest'
import { migrateDatabase } from './migrate'
import { getEmbeddedMigrations } from './migrations'
import { openDatabase } from './client'
import {
  getProjectByName,
  loadUiContext,
  listActiveRuntimeSummaries,
  listModuleSummaries,
  listProjectSummaries,
  listWorkspaceSummaries,
  replaceProjectSnapshot,
  saveUiContext,
} from './repos/project-snapshot.repo'
import { modules, projects, runtimes, workspaces } from './schema'

const tempRoots: string[] = []
const runtimeSource = { provider: 'tmux', sourceId: 'test' }

function runtimeIdentity(externalId: string) {
  return { displayLabel: externalId, externalId, source: runtimeSource }
}

function runtimeAttachment(externalId: string) {
  return { identity: runtimeIdentity(externalId), status: 'open' as const }
}

function runtimeAttachmentFor(source: { provider: string; sourceId: string }, externalId: string) {
  return {
    identity: { displayLabel: externalId, externalId, source },
    status: 'open' as const,
  }
}

function projectRuntime(
  projectName: string,
  source: { provider: string; sourceId: string },
  externalId: string,
) {
  return {
    identity: { displayLabel: externalId, externalId, source },
    moduleName: null,
    projectName,
    scope: 'project' as const,
    status: 'open' as const,
    workspaceName: null,
  }
}

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { recursive: true, force: true })),
  )
})

describe('db', () => {
  it('migrates legacy tmux runtime cache by safely rebuilding it', async () => {
    const tempRoot = await createTempRoot()
    const database = await openDatabase(path.join(tempRoot, 'legacy.db'))

    try {
      const migrations = getEmbeddedMigrations()
      const sqlite = database.sqlite as unknown as {
        exec(sql: string): unknown
        prepare(sql: string): {
          all(): unknown[]
          get(): unknown
          run(...values: unknown[]): unknown
        }
      }

      for (const migration of migrations.slice(0, 6)) {
        for (const statement of migration.sql) {
          sqlite.exec(statement)
        }
      }

      sqlite
        .prepare(
          'INSERT INTO projects (id, name, repo_path, repo_kind, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .run('project', 'alpha', '/tmp/alpha.git', 'bare', 0, 0)
      sqlite
        .prepare(
          'INSERT INTO runtimes (id, project_id, session_name, scope, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
        .run('runtime', 'project', 'alpha', 'project', 'open', 0, 0)

      for (const statement of migrations[6]?.sql ?? []) {
        sqlite.exec(statement)
      }

      const columns = sqlite.prepare('PRAGMA table_info(runtimes)').all() as Array<{ name: string }>
      const runtimeCount = sqlite.prepare('SELECT count(*) AS count FROM runtimes').get() as {
        count: number
      }

      expect(columns.map((column) => column.name)).toEqual(
        expect.arrayContaining(['provider', 'source_id', 'external_id', 'display_label']),
      )
      expect(runtimeCount.count).toBe(0)
    } finally {
      database.sqlite.close()
    }
  })

  it('reconciles runtime observations by source and preserves failed sources', async () => {
    const tempRoot = await createTempRoot()
    const database = await openDatabase(path.join(tempRoot, 'harbour.db'))
    const tmuxSource = { provider: 'tmux', sourceId: '/tmp/tmux/default' }
    const otherSource = { provider: 'test', sourceId: 'secondary' }

    try {
      await migrateDatabase(database)
      const snapshot = {
        projectName: 'alpha',
        repoPath: '/tmp/alpha.git',
        repoKind: 'bare' as const,
        workspaces: [],
      }

      await replaceProjectSnapshot(database.db, {
        ...snapshot,
        runtimes: [projectRuntime('alpha', tmuxSource, 'tmux-alpha')],
        runtimeIssue: null,
        runtimeSource: tmuxSource,
      })
      await replaceProjectSnapshot(database.db, {
        ...snapshot,
        runtimes: [projectRuntime('alpha', otherSource, 'other-alpha')],
        runtimeIssue: null,
        runtimeSource: otherSource,
      })

      expect(listActiveRuntimeSummaries(database.db, tmuxSource)).toEqual([
        expect.objectContaining({
          runtime: runtimeAttachmentFor(tmuxSource, 'tmux-alpha'),
        }),
      ])
      expect(listProjectSummaries(database.db, otherSource)[0]?.runtime).toEqual(
        runtimeAttachmentFor(otherSource, 'other-alpha'),
      )

      await replaceProjectSnapshot(database.db, {
        ...snapshot,
        runtimes: [],
        runtimeIssue: null,
        runtimeSource: tmuxSource,
      })

      expect(listActiveRuntimeSummaries(database.db, tmuxSource)).toEqual([])
      expect(listActiveRuntimeSummaries(database.db, otherSource)).toHaveLength(1)

      await replaceProjectSnapshot(database.db, {
        ...snapshot,
        runtimes: [],
        runtimeIssue: { code: 'source_unavailable', source: otherSource },
        runtimeSource: otherSource,
      })

      expect(listActiveRuntimeSummaries(database.db, otherSource)).toHaveLength(1)
    } finally {
      database.sqlite.close()
    }
  })

  it('applies migrations and upserts project snapshot', async () => {
    const tempRoot = await createTempRoot()
    const databasePath = path.join(tempRoot, 'harbour.db')
    const database = await openDatabase(databasePath)

    try {
      await migrateDatabase(database)

      const snapshot = await replaceProjectSnapshot(database.db, {
        projectName: 'alpha',
        repoPath: '/tmp/alpha.git',
        repoKind: 'bare',
        workspaces: [
          {
            workspaceName: 'main',
            workspacePath: '/tmp/workspaces/alpha-main',
            kind: 'worktree',
            modules: [
              {
                name: 'apps/cli',
                path: 'apps/cli',
                workspacePath: '/tmp/workspaces/alpha-main/apps/cli',
                selector: { raw: 'apps/', path: 'apps', mode: 'children' },
              },
            ],
          },
        ],
        runtimes: [
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

      expect(snapshot.project.name).toBe('alpha')
      expect(snapshot.workspaces).toEqual([
        expect.objectContaining({
          name: 'main',
          workspacePath: '/tmp/workspaces/alpha-main',
          kind: 'worktree',
        }),
      ])
      expect(snapshot.modules).toHaveLength(1)
      expect(snapshot.runtimes).toHaveLength(1)

      const persistedProject = await getProjectByName(database.db, 'alpha')
      expect(persistedProject?.repoKind).toBe('bare')
    } finally {
      database.sqlite.close()
    }
  })

  it('replaces stale workspace and module rows on refresh', async () => {
    const tempRoot = await createTempRoot()
    const databasePath = path.join(tempRoot, 'harbour.db')
    const database = await openDatabase(databasePath)

    try {
      await migrateDatabase(database)

      await replaceProjectSnapshot(database.db, {
        projectName: 'alpha',
        repoPath: '/tmp/alpha.git',
        repoKind: 'standard',
        workspaces: [
          {
            workspaceName: 'main',
            workspacePath: '/tmp/workspaces/alpha-main',
            kind: 'default',
            modules: [
              {
                name: 'apps/cli',
                path: 'apps/cli',
                workspacePath: '/tmp/workspaces/alpha-main/apps/cli',
                selector: { raw: 'apps/', path: 'apps', mode: 'children' },
              },
              {
                name: 'apps/tui',
                path: 'apps/tui',
                workspacePath: '/tmp/workspaces/alpha-main/apps/tui',
                selector: { raw: 'apps/', path: 'apps', mode: 'children' },
              },
            ],
          },
          {
            workspaceName: 'feature-auth',
            workspacePath: '/tmp/workspaces/alpha-feature-auth',
            kind: 'worktree',
            modules: [
              {
                name: 'apps/cli',
                path: 'apps/cli',
                workspacePath: '/tmp/workspaces/alpha-feature-auth/apps/cli',
                selector: { raw: 'apps/', path: 'apps', mode: 'children' },
              },
            ],
          },
        ],
        runtimes: [
          {
            identity: runtimeIdentity('alpha__main'),
            scope: 'workspace',
            projectName: 'alpha',
            workspaceName: 'main',
            moduleName: null,
            status: 'open',
          },
        ],
        runtimeIssue: null,
        runtimeSource,
      })

      await replaceProjectSnapshot(database.db, {
        projectName: 'alpha',
        repoPath: '/tmp/alpha.git',
        repoKind: 'standard',
        workspaces: [
          {
            workspaceName: 'next',
            workspacePath: '/tmp/workspaces/alpha-next',
            kind: 'worktree',
            modules: [
              {
                name: 'apps/cli',
                path: 'apps/cli',
                workspacePath: '/tmp/workspaces/alpha-next/apps/cli',
                selector: { raw: 'apps/', path: 'apps', mode: 'children' },
              },
            ],
          },
        ],
        runtimes: [
          {
            identity: runtimeIdentity('alpha__next__apps/cli'),
            scope: 'module',
            projectName: 'alpha',
            workspaceName: 'next',
            moduleName: 'apps/cli',
            status: 'open',
          },
        ],
        runtimeIssue: null,
        runtimeSource,
      })

      const projectRows = await database.db.select().from(projects)
      const workspaceRows = await database.db.select().from(workspaces)
      const moduleRows = await database.db.select().from(modules)
      const runtimeRows = await database.db.select().from(runtimes)

      expect(projectRows).toHaveLength(1)
      expect(workspaceRows).toHaveLength(1)
      expect(workspaceRows[0]?.name).toBe('next')
      expect(workspaceRows[0]?.kind).toBe('worktree')
      expect(workspaceRows[0]?.workspacePath).toBe('/tmp/workspaces/alpha-next')
      expect(moduleRows).toHaveLength(1)
      expect(moduleRows[0]?.modulePath).toBe('apps/cli')
      expect(runtimeRows).toHaveLength(1)
      expect(runtimeRows[0]?.externalId).toBe('alpha__next__apps/cli')
    } finally {
      database.sqlite.close()
    }
  })

  it('clears workspaces when project has no linked workspace', async () => {
    const tempRoot = await createTempRoot()
    const databasePath = path.join(tempRoot, 'harbour.db')
    const database = await openDatabase(databasePath)

    try {
      await migrateDatabase(database)

      await replaceProjectSnapshot(database.db, {
        projectName: 'alpha',
        repoPath: '/tmp/alpha.git',
        repoKind: 'bare',
        workspaces: [
          {
            workspaceName: 'main',
            workspacePath: '/tmp/workspaces/alpha-main',
            kind: 'worktree',
            modules: [
              {
                name: 'docs',
                path: 'docs',
                workspacePath: '/tmp/workspaces/alpha-main/docs',
                selector: { raw: 'docs', path: 'docs', mode: 'explicit' },
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
            identity: runtimeIdentity('alpha__main__docs'),
            scope: 'module',
            projectName: 'alpha',
            workspaceName: 'main',
            moduleName: 'docs',
            status: 'open',
          },
        ],
        runtimeIssue: null,
        runtimeSource,
      })

      await replaceProjectSnapshot(database.db, {
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
        runtimeIssue: null,
        runtimeSource,
      })

      const project = await database.db.query.projects.findFirst({
        where: eq(projects.name, 'alpha'),
      })
      const workspaceRows = await database.db.select().from(workspaces)
      const moduleRows = await database.db.select().from(modules)
      const runtimeRows = await database.db.select().from(runtimes)

      expect(project).not.toBeNull()
      expect(workspaceRows).toHaveLength(0)
      expect(moduleRows).toHaveLength(0)
      expect(runtimeRows).toHaveLength(1)
      expect(runtimeRows[0]?.externalId).toBe('alpha')
    } finally {
      database.sqlite.close()
    }
  })

  it('lists project, workspace, and module summaries with active status', async () => {
    const tempRoot = await createTempRoot()
    const databasePath = path.join(tempRoot, 'harbour.db')
    const database = await openDatabase(databasePath)

    try {
      await migrateDatabase(database)

      const alphaSnapshot = await replaceProjectSnapshot(database.db, {
        projectIssue: 'Repo HEAD points to missing branch refs/heads/master',
        projectName: 'alpha',
        repoPath: '/tmp/alpha.git',
        repoKind: 'standard',
        workspaces: [
          {
            workspaceName: 'main',
            workspacePath: '/tmp/alpha-main',
            kind: 'default',
            modules: [
              {
                name: 'apps/cli',
                path: 'apps/cli',
                workspacePath: '/tmp/alpha-main/apps/cli',
                selector: { raw: 'apps/', path: 'apps', mode: 'children' },
              },
              {
                name: 'apps/tui',
                path: 'apps/tui',
                workspacePath: '/tmp/alpha-main/apps/tui',
                selector: { raw: 'apps/', path: 'apps', mode: 'children' },
              },
            ],
          },
          {
            workspaceName: 'feature-auth',
            workspacePath: '/tmp/alpha-feature-auth',
            kind: 'worktree',
            modules: [
              {
                name: 'apps/cli',
                path: 'apps/cli',
                workspacePath: '/tmp/alpha-feature-auth/apps/cli',
                selector: { raw: 'apps/', path: 'apps', mode: 'children' },
              },
              {
                name: 'apps/web',
                path: 'apps/web',
                workspacePath: '/tmp/alpha-feature-auth/apps/web',
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
          {
            identity: runtimeIdentity('alpha__feature-auth__apps/web'),
            scope: 'module',
            projectName: 'alpha',
            workspaceName: 'feature-auth',
            moduleName: 'apps/web',
            status: 'open',
          },
        ],
        runtimeIssue: null,
        runtimeSource,
      })

      await replaceProjectSnapshot(database.db, {
        projectName: 'beta',
        repoPath: '/tmp/beta.git',
        repoKind: 'bare',
        workspaces: [],
        runtimes: [],
        runtimeIssue: null,
        runtimeSource,
      })

      const mainWorkspaceId = alphaSnapshot.workspaces.find(
        (workspace) => workspace.name === 'main',
      )?.id
      const featureWorkspaceId = alphaSnapshot.workspaces.find(
        (workspace) => workspace.name === 'feature-auth',
      )?.id

      expect(listProjectSummaries(database.db, runtimeSource)).toEqual([
        {
          id: alphaSnapshot.project.id,
          name: 'alpha',
          projectIssue: 'Repo HEAD points to missing branch refs/heads/master',
          repoPath: '/tmp/alpha.git',
          repoKind: 'standard',
          runtime: runtimeAttachment('alpha'),
          activeSessionCount: 4,
          workspaceCount: 2,
          hasModules: true,
          hasWorkspaces: true,
        },
        {
          id: expect.any(String),
          name: 'beta',
          projectIssue: null,
          repoPath: '/tmp/beta.git',
          repoKind: 'bare',
          runtime: null,
          activeSessionCount: 0,
          workspaceCount: 0,
          hasModules: false,
          hasWorkspaces: false,
        },
      ])

      expect(listWorkspaceSummaries(database.db, alphaSnapshot.project.id, runtimeSource)).toEqual([
        {
          branchName: null,
          id: mainWorkspaceId,
          projectId: alphaSnapshot.project.id,
          kind: 'default',
          name: 'main',
          projectName: 'alpha',
          repoPath: '/tmp/alpha.git',
          runtime: runtimeAttachment('alpha__main'),
          workspacePath: '/tmp/alpha-main',
          activeSessionCount: 2,
          moduleCount: 2,
          hasModules: true,
          isDefault: true,
        },
        {
          branchName: null,
          id: featureWorkspaceId,
          projectId: alphaSnapshot.project.id,
          kind: 'worktree',
          name: 'feature-auth',
          projectName: 'alpha',
          repoPath: '/tmp/alpha.git',
          runtime: null,
          workspacePath: '/tmp/alpha-feature-auth',
          activeSessionCount: 1,
          moduleCount: 2,
          hasModules: true,
          isDefault: false,
        },
      ])

      expect(mainWorkspaceId).toBeDefined()

      expect(listModuleSummaries(database.db, mainWorkspaceId ?? 'missing', runtimeSource)).toEqual(
        [
          {
            id: expect.any(String),
            projectId: alphaSnapshot.project.id,
            workspaceId: mainWorkspaceId,
            name: 'apps/cli',
            path: 'apps/cli',
            projectName: 'alpha',
            repoPath: '/tmp/alpha.git',
            runtime: runtimeAttachment('alpha__main__apps/cli'),
            workspaceName: 'main',
            workspacePath: '/tmp/alpha-main',
            hasActiveSession: true,
          },
          {
            id: expect.any(String),
            projectId: alphaSnapshot.project.id,
            workspaceId: mainWorkspaceId,
            name: 'apps/tui',
            path: 'apps/tui',
            projectName: 'alpha',
            repoPath: '/tmp/alpha.git',
            runtime: null,
            workspaceName: 'main',
            workspacePath: '/tmp/alpha-main',
            hasActiveSession: false,
          },
        ],
      )
    } finally {
      database.sqlite.close()
    }
  })

  it('lists configured root modules as slash labels with workspace activity', async () => {
    const tempRoot = await createTempRoot()
    const databasePath = path.join(tempRoot, 'harbour.db')
    const database = await openDatabase(databasePath)

    try {
      await migrateDatabase(database)

      const snapshot = await replaceProjectSnapshot(database.db, {
        projectName: 'alpha',
        repoPath: '/tmp/alpha.git',
        repoKind: 'standard',
        workspaces: [
          {
            workspaceName: 'main',
            workspacePath: '/tmp/alpha-main',
            kind: 'default',
            modules: [
              {
                name: '/',
                path: '.',
                workspacePath: '/tmp/alpha-main',
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
        ],
        runtimeIssue: null,
        runtimeSource,
      })

      const workspaceId = snapshot.workspaces[0]?.id

      expect(listModuleSummaries(database.db, workspaceId ?? 'missing', runtimeSource)).toEqual([
        {
          id: expect.any(String),
          projectId: snapshot.project.id,
          workspaceId,
          name: '/',
          path: '.',
          projectName: 'alpha',
          repoPath: '/tmp/alpha.git',
          runtime: null,
          workspaceName: 'main',
          workspacePath: '/tmp/alpha-main',
          hasActiveSession: true,
        },
      ])
    } finally {
      database.sqlite.close()
    }
  })

  it('maps root module runtimes back to dot module paths', async () => {
    const tempRoot = await createTempRoot()
    const databasePath = path.join(tempRoot, 'harbour.db')
    const database = await openDatabase(databasePath)

    try {
      await migrateDatabase(database)

      const snapshot = await replaceProjectSnapshot(database.db, {
        projectName: 'alpha',
        repoPath: '/tmp/alpha.git',
        repoKind: 'standard',
        workspaces: [
          {
            workspaceName: 'main',
            workspacePath: '/tmp/alpha-main',
            kind: 'default',
            modules: [
              {
                name: '/',
                path: '.',
                workspacePath: '/tmp/alpha-main',
                selector: { raw: '.', path: '.', mode: 'explicit' },
              },
            ],
          },
        ],
        runtimes: [
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

      const runtimeRows = await database.db.select().from(runtimes)
      const workspaceId = snapshot.workspaces[0]?.id

      expect(runtimeRows[0]?.modulePath).toBe('.')
      expect(listModuleSummaries(database.db, workspaceId ?? 'missing', runtimeSource)).toEqual([
        {
          id: expect.any(String),
          projectId: snapshot.project.id,
          workspaceId,
          name: '/',
          path: '.',
          projectName: 'alpha',
          repoPath: '/tmp/alpha.git',
          runtime: runtimeAttachment('alpha~~main~~/'),
          workspaceName: 'main',
          workspacePath: '/tmp/alpha-main',
          hasActiveSession: true,
        },
      ])
    } finally {
      database.sqlite.close()
    }
  })

  it('persists sticky ui context across project, workspace, and module selection', async () => {
    const tempRoot = await createTempRoot()
    const databasePath = path.join(tempRoot, 'harbour.db')
    const database = await openDatabase(databasePath)

    try {
      await migrateDatabase(database)

      const snapshot = await replaceProjectSnapshot(database.db, {
        projectName: 'alpha',
        repoPath: '/tmp/alpha.git',
        repoKind: 'standard',
        workspaces: [
          {
            workspaceName: 'main',
            workspacePath: '/tmp/alpha-main',
            kind: 'default',
            modules: [
              {
                name: 'apps/tui',
                path: 'apps/tui',
                workspacePath: '/tmp/alpha-main/apps/tui',
                selector: { raw: 'apps/', path: 'apps', mode: 'children' },
              },
            ],
          },
        ],
        runtimes: [],
        runtimeIssue: null,
        runtimeSource,
      })

      const workspace = snapshot.workspaces[0]
      const module = snapshot.modules[0]

      expect(loadUiContext(database.db)).toEqual({})

      expect(
        saveUiContext(database.db, {
          projectId: snapshot.project.id,
          ...(workspace?.id ? { workspaceId: workspace.id } : {}),
          ...(module?.id ? { moduleId: module.id } : {}),
        }),
      ).toEqual({
        projectId: snapshot.project.id,
        ...(workspace?.id ? { workspaceId: workspace.id } : {}),
        ...(module?.id ? { moduleId: module.id } : {}),
      })

      expect(loadUiContext(database.db)).toEqual({
        projectId: snapshot.project.id,
        ...(workspace?.id ? { workspaceId: workspace.id } : {}),
        ...(module?.id ? { moduleId: module.id } : {}),
      })
    } finally {
      database.sqlite.close()
    }
  })
})

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(tmpdir(), 'harbour-db-'))
  tempRoots.push(tempRoot)
  return tempRoot
}
