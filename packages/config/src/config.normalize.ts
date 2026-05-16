import path from 'node:path'

import type { ZodIssue } from 'zod'
import type {
  HarbourConfigIssue,
  HarbourConfigIssueCode,
} from './config.errors'

export function normalizeModuleSelector(selector: string) {
  const mode = selector.endsWith('/') ? 'children' : 'explicit'
  const trimmedSelector = mode === 'children' ? selector.slice(0, -1) : selector

  return {
    path: stripLeadingCurrentDir(path.normalize(trimmedSelector)),
    mode,
  } as const
}

export function isWithinParent(parentPath: string, childPath: string) {
  const relativePath = path.relative(parentPath, childPath)

  return (
    relativePath === '' ||
    (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
  )
}

export function mapSchemaIssue(issue: ZodIssue): HarbourConfigIssue {
  return {
    code: getSchemaIssueCode(issue),
    path: issue.path.map((segment) =>
      typeof segment === 'symbol' ? String(segment) : segment,
    ),
    message: issue.message,
  }
}

function stripLeadingCurrentDir(inputPath: string) {
  if (inputPath === '.') {
    return inputPath
  }

  return inputPath.replace(/^\.\//, '')
}

function getSchemaIssueCode(issue: ZodIssue): HarbourConfigIssueCode {
  const customCode =
    issue.code === 'custom' ? issue.params?.issueCode : undefined

  if (
    customCode === 'duplicate_project_name' ||
    customCode === 'module_path_not_relative'
  ) {
    return customCode
  }

  return 'schema'
}
