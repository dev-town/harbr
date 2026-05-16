import { randomUUID } from 'node:crypto'

import type {
  ModuleRecord,
  ProjectRecord,
  ResolvedModule,
  RuntimeFact,
  RuntimeRecord,
  WorkspaceRecord,
} from '@harbour/domain'
import { eq } from 'drizzle-orm'
import type { HarbourDatabase, ReplaceProjectSnapshotInput } from '../db.types'
import {
  moduleRowSchema,
  modules,
  projectRowSchema,
  projects,
  runtimeRowSchema,
  runtimes,
  workspaceRowSchema,
  workspaces,
} from '../schema'

export function getProjectByName(
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

export function replaceProjectSnapshot(
  db: HarbourDatabase,
  input: ReplaceProjectSnapshotInput,
) {
  return db.transaction((tx) => {
    const project = upsertProject(tx, input)

    tx.delete(workspaces).where(eq(workspaces.projectId, project.id)).run()
    tx.delete(runtimes).where(eq(runtimes.projectId, project.id)).run()

    if (!input.workspacePath) {
      const runtimeRecords = insertRuntimes(tx, project.id, null, input.runtimes, now())

      return {
        project,
        workspace: null,
        modules: [] satisfies ModuleRecord[],
        runtimes: runtimeRecords,
      }
    }

    const createdAt = now()
    const workspaceId = randomUUID()
    const workspaceName = input.workspaceName ?? 'main'

    tx
      .insert(workspaces)
      .values({
        id: workspaceId,
        projectId: project.id,
        name: workspaceName,
        workspacePath: input.workspacePath,
        createdAt,
        updatedAt: createdAt,
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
        : insertModules(tx, workspace.id, input.modules, createdAt)

    const runtimeRecords = insertRuntimes(
      tx,
      project.id,
      workspace.id,
      input.runtimes,
      createdAt,
    )

    return {
      project,
      workspace,
      modules: moduleRecords,
      runtimes: runtimeRecords,
    }
  })
}

function now() {
  return Date.now()
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

function insertRuntimes(
  db: HarbourDatabase,
  projectId: string,
  workspaceId: string | null,
  runtimeFacts: RuntimeFact[],
  createdAt: number,
) {
  for (const runtime of runtimeFacts) {
    db
      .insert(runtimes)
      .values({
        id: randomUUID(),
        projectId,
        workspaceId: runtime.scope === 'project' ? null : workspaceId,
        sessionName: runtime.sessionName,
        scope: runtime.scope,
        modulePath: runtime.scope === 'module' ? runtime.moduleName : null,
        status: runtime.status,
        createdAt,
        updatedAt: createdAt,
      })
      .run()
  }

  const rows = db.select().from(runtimes).where(eq(runtimes.projectId, projectId)).all()

  return rows.map((row) => mapRuntimeRow(runtimeRowSchema.parse(row)))
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
    name: row.name,
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

function mapRuntimeRow(row: ReturnType<typeof runtimeRowSchema.parse>): RuntimeRecord {
  return {
    id: row.id,
    projectId: row.projectId,
    workspaceId: row.workspaceId,
    sessionName: row.sessionName,
    scope: row.scope,
    modulePath: row.modulePath,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
