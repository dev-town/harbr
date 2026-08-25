import type { EmbeddedMigrationSource } from '../migrations.types'

export default {
  breakpoints: true,
  sql: 'DROP TABLE `runtimes`;--> statement-breakpoint\nCREATE TABLE `runtimes` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`project_id` text NOT NULL,\n\t`workspace_id` text,\n\t`provider` text NOT NULL,\n\t`source_id` text NOT NULL,\n\t`external_id` text NOT NULL,\n\t`display_label` text NOT NULL,\n\t`scope` text NOT NULL,\n\t`module_path` text,\n\t`status` text NOT NULL,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL,\n\tFOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,\n\tFOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade\n);\n--> statement-breakpoint\nCREATE UNIQUE INDEX `runtimes_source_external_idx` ON `runtimes` (`provider`,`source_id`,`external_id`);\n',
  tag: '0006_common_ricochet',
  when: 1787691007607,
} satisfies EmbeddedMigrationSource
