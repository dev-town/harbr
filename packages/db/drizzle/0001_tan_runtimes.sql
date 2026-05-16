ALTER TABLE `workspaces` ADD `name` text NOT NULL DEFAULT 'main';
--> statement-breakpoint
CREATE TABLE `runtimes` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`workspace_id` text,
	`session_name` text NOT NULL,
	`scope` text NOT NULL,
	`module_path` text,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `runtimes_session_name_unique` ON `runtimes` (`session_name`);
--> statement-breakpoint
CREATE UNIQUE INDEX `runtimes_project_session_idx` ON `runtimes` (`project_id`,`session_name`);
