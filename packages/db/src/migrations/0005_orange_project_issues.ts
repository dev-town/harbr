import type { EmbeddedMigrationSource } from '../migrations.types'

export default {
  breakpoints: true,
  sql: 'ALTER TABLE `projects` ADD `project_issue` text;\n',
  tag: '0005_orange_project_issues',
  when: 1780800000000,
} satisfies EmbeddedMigrationSource
