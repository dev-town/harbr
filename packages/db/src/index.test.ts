import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { eq } from 'drizzle-orm'
import { afterEach, describe, expect, it } from 'vitest'
import { migrateDatabase } from './migrate'
import { openDatabase } from './client'
import { getProjectByName, replaceProjectSnapshot } from './repositories'
import { modules, projects, workspaces } from './schema'

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
        workspacePath: '/tmp/workspaces/alpha-main',
        modules: [
          {
            name: 'apps/cli',
            path: 'apps/cli',
            workspacePath: '/tmp/workspaces/alpha-main/apps/cli',
            selector: { raw: 'apps/', path: 'apps', mode: 'children' },
          },
        ],
      })

      expect(snapshot.project.name).toBe('alpha')
      expect(snapshot.workspace?.workspacePath).toBe('/tmp/workspaces/alpha-main')
      expect(snapshot.modules).toHaveLength(1)

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
      })

      await replaceProjectSnapshot(database.db, {
        projectName: 'alpha',
        repoPath: '/tmp/alpha.git',
        repoKind: 'standard',
        workspacePath: '/tmp/workspaces/alpha-next',
        modules: [
          {
            name: 'apps/cli',
            path: 'apps/cli',
            workspacePath: '/tmp/workspaces/alpha-next/apps/cli',
            selector: { raw: 'apps/', path: 'apps', mode: 'children' },
          },
        ],
      })

      const projectRows = await database.db.select().from(projects)
      const workspaceRows = await database.db.select().from(workspaces)
      const moduleRows = await database.db.select().from(modules)

      expect(projectRows).toHaveLength(1)
      expect(workspaceRows).toHaveLength(1)
      expect(workspaceRows[0]?.workspacePath).toBe('/tmp/workspaces/alpha-next')
      expect(moduleRows).toHaveLength(1)
      expect(moduleRows[0]?.modulePath).toBe('apps/cli')
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
        workspacePath: '/tmp/workspaces/alpha-main',
        modules: [
          {
            name: 'docs',
            path: 'docs',
            workspacePath: '/tmp/workspaces/alpha-main/docs',
            selector: { raw: 'docs', path: 'docs', mode: 'explicit' },
          },
        ],
      })

      await replaceProjectSnapshot(database.db, {
        projectName: 'alpha',
        repoPath: '/tmp/alpha.git',
        repoKind: 'bare',
        workspacePath: null,
        modules: [],
      })

      const project = await database.db.query.projects.findFirst({
        where: eq(projects.name, 'alpha'),
      })
      const workspaceRows = await database.db.select().from(workspaces)
      const moduleRows = await database.db.select().from(modules)

      expect(project).not.toBeNull()
      expect(workspaceRows).toHaveLength(0)
      expect(moduleRows).toHaveLength(0)
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
