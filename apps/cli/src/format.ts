import type { HarbourConfigIssue } from '@harbour/config'
import type { SyncProjectResult, SyncResult } from '@harbour/domain'

type CliError = {
  _tag?: string
  configPath?: string
  repoPath?: string
  issues?: HarbourConfigIssue[]
  message?: string
}

export function formatCliOutput(output: SyncResult) {
  return output.projects.map(formatProjectResult).join('\n\n')
}

export function formatCliError(error: CliError) {
  if (error._tag === 'InvalidConfigError' && error.issues) {
    const lines = [
      `config error: ${error._tag}`,
      ...(error.configPath ? [`  config: ${error.configPath}`] : []),
      '  issues:',
      ...error.issues.map(formatConfigIssue),
    ]

    return lines.join('\n')
  }

  const location = error.configPath ?? error.repoPath
  const lines = [`error: ${error._tag ?? 'unknown'}`]

  if (location) {
    lines.push(`  path: ${location}`)
  }

  if (error.message) {
    lines.push(`  message: ${error.message}`)
  }

  return lines.join('\n')
}

function formatProjectResult(result: SyncProjectResult) {
  if (result.status === 'error') {
    return [result.projectName, `  error: ${result.errorTag ?? 'unknown'}`].join(
      '\n',
    )
  }

  const lines = [
    result.projectName,
    `  repo: ${result.repoKind ?? 'unknown'}`,
    `  workspaces: ${result.workspaceCount}`,
    `  modules: ${result.moduleCount}`,
    `  runtimes: ${result.runtimeCount}`,
  ]

  if (result.status === 'no_workspace') {
    lines.push('  status: no workspace')
  }

  if (result.runtimeIssue) {
    lines.push(`  runtime issue: ${result.runtimeIssue}`)
  }

  return lines.join('\n')
}

function formatConfigIssue(issue: HarbourConfigIssue) {
  const location = issue.path.length > 0 ? issue.path.join('.') : 'root'
  return `    ${location}: ${issue.message}`
}
