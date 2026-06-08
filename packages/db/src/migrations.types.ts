export type EmbeddedMigrationSource = {
  readonly breakpoints: boolean
  readonly sql: string
  readonly tag: string
  readonly when: number
}
