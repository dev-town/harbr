import type { EmbeddedMigrationSource } from '../migrations.types'

export default {
  breakpoints: true,
  sql: "ALTER TABLE `workspaces` ADD `kind` text NOT NULL DEFAULT 'default';\n",
  tag: '0002_blue_workspaces',
  when: 1778600000000,
} satisfies EmbeddedMigrationSource
