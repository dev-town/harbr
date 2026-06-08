import type { EmbeddedMigrationSource } from '../migrations.types'

export default {
  breakpoints: true,
  sql: 'CREATE TABLE `ui_context` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`project_id` text,\n\t`workspace_id` text,\n\t`module_id` text,\n\t`updated_at` integer NOT NULL,\n\tFOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,\n\tFOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE set null,\n\tFOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE set null\n);\n',
  tag: '0003_silver_ui_context',
  when: 1778700000000,
} satisfies EmbeddedMigrationSource
