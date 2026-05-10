import { relations } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { createSelectSchema } from 'drizzle-zod'

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  repoPath: text('repo_path').notNull(),
  repoKind: text('repo_kind', { enum: ['bare', 'standard'] }).notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  workspacePath: text('workspace_path').notNull().unique(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const modules = sqliteTable(
  'modules',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    modulePath: text('module_path').notNull(),
    selectorRaw: text('selector_raw').notNull(),
    selectorPath: text('selector_path').notNull(),
    selectorMode: text('selector_mode', {
      enum: ['children', 'explicit'],
    }).notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('modules_workspace_path_idx').on(
      table.workspaceId,
      table.modulePath,
    ),
  ],
)

export const projectRelations = relations(projects, ({ many }) => ({
  workspaces: many(workspaces),
}))

export const workspaceRelations = relations(workspaces, ({ one, many }) => ({
  project: one(projects, {
    fields: [workspaces.projectId],
    references: [projects.id],
  }),
  modules: many(modules),
}))

export const moduleRelations = relations(modules, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [modules.workspaceId],
    references: [workspaces.id],
  }),
}))

export const projectRowSchema = createSelectSchema(projects)
export const workspaceRowSchema = createSelectSchema(workspaces)
export const moduleRowSchema = createSelectSchema(modules)

export type ProjectRow = typeof projects.$inferSelect
export type WorkspaceRow = typeof workspaces.$inferSelect
export type ModuleRow = typeof modules.$inferSelect
