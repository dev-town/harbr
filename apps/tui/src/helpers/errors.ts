import type { HarbourConfigIssue } from '@harbr/config'

export function formatError(error: unknown) {
  if (isTaggedError(error, 'InvalidBranchNameError')) {
    return 'Branch name is not a valid Git branch name'
  }

  if (isInvalidConfigError(error)) {
    return ['Invalid config', ...error.issues.map(formatConfigIssue)].join(': ')
  }

  if (isConfigPathError(error)) {
    return `${error._tag}: ${error.configPath}`
  }

  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

function isTaggedError(error: unknown, tag: string): error is { _tag: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    '_tag' in error &&
    error._tag === tag
  )
}

function isInvalidConfigError(
  error: unknown,
): error is { _tag: 'InvalidConfigError'; issues: HarbourConfigIssue[] } {
  return (
    isTaggedError(error, 'InvalidConfigError') &&
    'issues' in error &&
    Array.isArray(error.issues)
  )
}

function isConfigPathError(error: unknown): error is {
  _tag: 'ConfigNotFoundError' | 'ConfigReadError' | 'InvalidJsonError'
  configPath: string
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    '_tag' in error &&
    typeof error._tag === 'string' &&
    ['ConfigNotFoundError', 'ConfigReadError', 'InvalidJsonError'].includes(
      error._tag,
    ) &&
    'configPath' in error &&
    typeof error.configPath === 'string'
  )
}

function formatConfigIssue(issue: HarbourConfigIssue) {
  const location = issue.path.length > 0 ? issue.path.join('.') : 'root'
  return `${location}: ${issue.message}`
}
