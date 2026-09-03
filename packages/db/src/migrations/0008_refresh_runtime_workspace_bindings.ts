import type { EmbeddedMigrationSource } from '../migrations.types'

export default {
  breakpoints: true,
  sql: 'DELETE FROM `runtimes`;\n',
  tag: '0008_refresh_runtime_workspace_bindings',
  when: 1788430182790,
} satisfies EmbeddedMigrationSource
