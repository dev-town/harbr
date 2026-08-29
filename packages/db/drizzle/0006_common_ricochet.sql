DROP TABLE `runtimes`;--> statement-breakpoint
CREATE TABLE `runtimes` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`workspace_id` text,
	`provider` text NOT NULL,
	`source_id` text NOT NULL,
	`external_id` text NOT NULL,
	`display_label` text NOT NULL,
	`scope` text NOT NULL,
	`module_path` text,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `runtimes_source_external_idx` ON `runtimes` (`provider`,`source_id`,`external_id`);
