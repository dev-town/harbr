import type { EmbeddedMigrationSource } from '../migrations.types'

export default {
  breakpoints: true,
  sql: 'ALTER TABLE `workspaces` ADD `branch_name` text;\n',
  tag: '0004_teal_workspace_branches',
  when: 1780700000000,
} satisfies EmbeddedMigrationSource
