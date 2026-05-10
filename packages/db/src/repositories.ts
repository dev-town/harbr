import { randomUUID } from 'node:crypto'

import type {
  ModuleRecord,
  ProjectRecord,
  RepoKind,
  ResolvedModule,
  WorkspaceRecord,
} from '@harbour/domain'
import { eq } from 'drizzle-orm'
import type { HarbourDatabase } from './client'
import {
  moduleRowSchema,
  modules,
  projectRowSchema,
  projects,
  workspaceRowSchema,
  workspaces,
} from './schema'

export type ReplaceProjectSnapshotInput = {
  projectName: string
  repoPath: string
  repoKind: RepoKind
  workspacePath: string | null
  modules: ResolvedModule[]
}

export async function getProjectByName(
  db: HarbourDatabase,
  projectName: string,
) {
  const row = db
    .select()
    .from(projects)
    .where(eq(projects.name, projectName))
    .get()

  return row ? mapProjectRow(projectRowSchema.parse(row)) : null
}

export function upsertProject(
  db: HarbourDatabase,
  input: Pick<ReplaceProjectSnapshotInput, 'projectName' | 'repoKind' | 'repoPath'>,
) {
  const now = Date.now()
  const existing = db
    .select()
    .from(projects)
    .where(eq(projects.name, input.projectName))
    .get()

  if (existing) {
    db
      .update(projects)
      .set({
        repoPath: input.repoPath,
        repoKind: input.repoKind,
        updatedAt: now,
      })
      .where(eq(projects.id, existing.id))
      .run()

    const row = db.select().from(projects).where(eq(projects.id, existing.id)).get()

    if (!row) {
      throw new Error(`project disappeared after update: ${existing.id}`)
    }

    return mapProjectRow(projectRowSchema.parse(row))
  }

  const projectId = randomUUID()

  db
    .insert(projects)
    .values({
      id: projectId,
      name: input.projectName,
      repoPath: input.repoPath,
      repoKind: input.repoKind,
      createdAt: now,
      updatedAt: now,
    })
    .run()

  const row = db.select().from(projects).where(eq(projects.id, projectId)).get()

  if (!row) {
    throw new Error(`project not found after insert: ${projectId}`)
  }

  return mapProjectRow(projectRowSchema.parse(row))
}

export async function replaceProjectSnapshot(
  db: HarbourDatabase,
  input: ReplaceProjectSnapshotInput,
) {
  return db.transaction((tx) => {
    const project = upsertProject(tx, input)

    tx.delete(workspaces).where(eq(workspaces.projectId, project.id)).run()

    if (!input.workspacePath) {
      return {
        project,
        workspace: null,
        modules: [] satisfies ModuleRecord[],
      }
    }

    const now = Date.now()
    const workspaceId = randomUUID()

    tx
      .insert(workspaces)
      .values({
        id: workspaceId,
        projectId: project.id,
        workspacePath: input.workspacePath,
        createdAt: now,
        updatedAt: now,
      })
      .run()

    const workspaceRow = tx
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .get()

    if (!workspaceRow) {
      throw new Error(`workspace not found after insert: ${workspaceId}`)
    }

    const workspace = mapWorkspaceRow(workspaceRowSchema.parse(workspaceRow))

    const moduleRecords =
      input.modules.length === 0
        ? []
        : insertModules(tx, workspace.id, input.modules, now)

    return {
      project,
      workspace,
      modules: moduleRecords,
    }
  })
}

function insertModules(
  db: HarbourDatabase,
  workspaceId: string,
  resolvedModules: ResolvedModule[],
  now: number,
) {
  for (const module of resolvedModules) {
    db
      .insert(modules)
      .values({
        id: randomUUID(),
        workspaceId,
        name: module.name,
        modulePath: module.path,
        selectorRaw: module.selector.raw,
        selectorPath: module.selector.path,
        selectorMode: module.selector.mode,
        createdAt: now,
        updatedAt: now,
      })
      .run()
  }

  const rows = db.select().from(modules).where(eq(modules.workspaceId, workspaceId)).all()

  return rows.map((row) => mapModuleRow(moduleRowSchema.parse(row)))
}

function mapProjectRow(row: ReturnType<typeof projectRowSchema.parse>): ProjectRecord {
  return {
    id: row.id,
    name: row.name,
    repoPath: row.repoPath,
    repoKind: row.repoKind,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function mapWorkspaceRow(
  row: ReturnType<typeof workspaceRowSchema.parse>,
): WorkspaceRecord {
  return {
    id: row.id,
    projectId: row.projectId,
    workspacePath: row.workspacePath,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function mapModuleRow(row: ReturnType<typeof moduleRowSchema.parse>): ModuleRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    path: row.modulePath,
    selector: {
      raw: row.selectorRaw,
      path: row.selectorPath,
      mode: row.selectorMode,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
