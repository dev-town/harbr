import type { EmbeddedMigrationSource } from '../migrations.types'

export default {
  breakpoints: true,
  sql: "ALTER TABLE `workspaces` ADD `workspace_provider` text DEFAULT 'external' NOT NULL;",
  tag: '0007_abnormal_king_bedlam',
  when: 1788383270947,
} satisfies EmbeddedMigrationSource
