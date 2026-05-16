import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { eq } from 'drizzle-orm'
import { afterEach, describe, expect, it } from 'vitest'
import { migrateDatabase } from './migrate'
import { openDatabase } from './client'
import { getProjectByName, replaceProjectSnapshot } from './repos/project-snapshot.repo'
import { modules, projects, runtimes, workspaces } from './schema'

const tempRoots: string[] = []

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map((tempRoot) => rm(tempRoot, { recursive: true, force: true })),
  )
})

describe('db', () => {
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
        workspaceName: 'main',
        workspacePath: '/tmp/workspaces/alpha-main',
        modules: [
          {
            name: 'apps/cli',
            path: 'apps/cli',
            workspacePath: '/tmp/workspaces/alpha-main/apps/cli',
            selector: { raw: 'apps/', path: 'apps', mode: 'children' },
          },
        ],
        runtimes: [
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

      expect(snapshot.project.name).toBe('alpha')
      expect(snapshot.workspace?.name).toBe('main')
      expect(snapshot.workspace?.workspacePath).toBe('/tmp/workspaces/alpha-main')
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
        workspaceName: 'main',
        workspacePath: '/tmp/workspaces/alpha-main',
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
        runtimes: [
          {
            sessionName: 'alpha__main',
            scope: 'workspace',
            projectName: 'alpha',
            workspaceName: 'main',
            moduleName: null,
            status: 'open',
          },
        ],
        runtimeIssue: null,
      })

      await replaceProjectSnapshot(database.db, {
        projectName: 'alpha',
        repoPath: '/tmp/alpha.git',
        repoKind: 'standard',
        workspaceName: 'next',
        workspacePath: '/tmp/workspaces/alpha-next',
        modules: [
          {
            name: 'apps/cli',
            path: 'apps/cli',
            workspacePath: '/tmp/workspaces/alpha-next/apps/cli',
            selector: { raw: 'apps/', path: 'apps', mode: 'children' },
          },
        ],
        runtimes: [
          {
            sessionName: 'alpha__next__apps/cli',
            scope: 'module',
            projectName: 'alpha',
            workspaceName: 'next',
            moduleName: 'apps/cli',
            status: 'open',
          },
        ],
        runtimeIssue: null,
      })

      const projectRows = await database.db.select().from(projects)
      const workspaceRows = await database.db.select().from(workspaces)
      const moduleRows = await database.db.select().from(modules)
      const runtimeRows = await database.db.select().from(runtimes)

      expect(projectRows).toHaveLength(1)
      expect(workspaceRows).toHaveLength(1)
      expect(workspaceRows[0]?.name).toBe('next')
      expect(workspaceRows[0]?.workspacePath).toBe('/tmp/workspaces/alpha-next')
      expect(moduleRows).toHaveLength(1)
      expect(moduleRows[0]?.modulePath).toBe('apps/cli')
      expect(runtimeRows).toHaveLength(1)
      expect(runtimeRows[0]?.sessionName).toBe('alpha__next__apps/cli')
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
        workspaceName: 'main',
        workspacePath: '/tmp/workspaces/alpha-main',
        modules: [
          {
            name: 'docs',
            path: 'docs',
            workspacePath: '/tmp/workspaces/alpha-main/docs',
            selector: { raw: 'docs', path: 'docs', mode: 'explicit' },
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
            sessionName: 'alpha__main__docs',
            scope: 'module',
            projectName: 'alpha',
            workspaceName: 'main',
            moduleName: 'docs',
            status: 'open',
          },
        ],
        runtimeIssue: null,
      })

      await replaceProjectSnapshot(database.db, {
        projectName: 'alpha',
        repoPath: '/tmp/alpha.git',
        repoKind: 'bare',
        workspaceName: null,
        workspacePath: null,
        modules: [],
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
        runtimeIssue: null,
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
      expect(runtimeRows[0]?.sessionName).toBe('alpha')
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
