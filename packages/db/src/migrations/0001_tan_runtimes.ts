import type { EmbeddedMigrationSource } from '../migrations.types'

export default {
  breakpoints: true,
  sql: "ALTER TABLE `workspaces` ADD `name` text NOT NULL DEFAULT 'main';\n--> statement-breakpoint\nCREATE TABLE `runtimes` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`project_id` text NOT NULL,\n\t`workspace_id` text,\n\t`session_name` text NOT NULL,\n\t`scope` text NOT NULL,\n\t`module_path` text,\n\t`status` text NOT NULL,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL,\n\tFOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,\n\tFOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade\n);\n--> statement-breakpoint\nCREATE UNIQUE INDEX `runtimes_session_name_unique` ON `runtimes` (`session_name`);\n--> statement-breakpoint\nCREATE UNIQUE INDEX `runtimes_project_session_idx` ON `runtimes` (`project_id`,`session_name`);\n",
  tag: '0001_tan_runtimes',
  when: 1778500000000,
} satisfies EmbeddedMigrationSource
