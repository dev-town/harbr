import type { EmbeddedMigrationSource } from '../migrations.types'

export default {
  breakpoints: true,
  sql: 'CREATE TABLE `modules` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`workspace_id` text NOT NULL,\n\t`name` text NOT NULL,\n\t`module_path` text NOT NULL,\n\t`selector_raw` text NOT NULL,\n\t`selector_path` text NOT NULL,\n\t`selector_mode` text NOT NULL,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL,\n\tFOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade\n);\n--> statement-breakpoint\nCREATE UNIQUE INDEX `modules_workspace_path_idx` ON `modules` (`workspace_id`,`module_path`);--> statement-breakpoint\nCREATE TABLE `projects` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`name` text NOT NULL,\n\t`repo_path` text NOT NULL,\n\t`repo_kind` text NOT NULL,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL\n);\n--> statement-breakpoint\nCREATE UNIQUE INDEX `projects_name_unique` ON `projects` (`name`);--> statement-breakpoint\nCREATE TABLE `workspaces` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`project_id` text NOT NULL,\n\t`workspace_path` text NOT NULL,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL,\n\tFOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade\n);\n--> statement-breakpoint\nCREATE UNIQUE INDEX `workspaces_workspace_path_unique` ON `workspaces` (`workspace_path`);',
  tag: '0000_brown_zaladane',
  when: 1778404556217,
} satisfies EmbeddedMigrationSource
