import { Data } from 'effect'

export type HarbourConfigIssueCode =
  | 'duplicate_pane_name'
  | 'duplicate_project_name'
  | 'duplicate_window_name'
  | 'module_path_not_relative'
  | 'repo_not_found'
  | 'schema'
  | 'unknown_window_ref'

export type HarbourConfigIssue = {
  code: HarbourConfigIssueCode
  path: (string | number)[]
  message: string
  projectName?: string
  value?: string
}

export class ConfigNotFoundError extends Data.TaggedError(
  'ConfigNotFoundError',
)<{
  configPath: string
}> {}

export class ConfigReadError extends Data.TaggedError('ConfigReadError')<{
  configPath: string
  message: string
}> {}

export class InvalidJsonError extends Data.TaggedError('InvalidJsonError')<{
  configPath: string
  message: string
}> {}

export class InvalidConfigError extends Data.TaggedError('InvalidConfigError')<{
  configPath: string
  issues: HarbourConfigIssue[]
}> {}

export type HarbourConfigError =
  | ConfigNotFoundError
  | ConfigReadError
  | InvalidJsonError
  | InvalidConfigError
