import type { EmbeddedMigrationSource } from './migrations.types'

export const embeddedMigrationSources = (
  await Promise.all([
    import('./migrations/0000_brown_zaladane'),
    import('./migrations/0001_tan_runtimes'),
    import('./migrations/0002_blue_workspaces'),
    import('./migrations/0003_silver_ui_context'),
    import('./migrations/0004_teal_workspace_branches'),
    import('./migrations/0005_orange_project_issues'),
  ])
).map((module) => module.default) satisfies EmbeddedMigrationSource[]
