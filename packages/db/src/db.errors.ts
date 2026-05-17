import { Data } from 'effect'

export class DatabaseOpenError extends Data.TaggedError('DatabaseOpenError')<{
  dbPath: string
  message: string
}> {}

export class DatabaseMigrationError extends Data.TaggedError(
  'DatabaseMigrationError',
)<{
  message: string
}> {}

export class ProjectServiceError extends Data.TaggedError(
  'ProjectServiceError',
)<{
  operation:
    | 'findByName'
    | 'loadUiContext'
    | 'listModuleSummaries'
    | 'listProjectSummaries'
    | 'listWorkspaceSummaries'
    | 'saveUiContext'
    | 'syncSnapshot'
  message: string
}> {}

export type HarbourDatabaseError = DatabaseOpenError | DatabaseMigrationError
