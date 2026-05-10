import type { HarbourConfigIssue } from '@harbour/config'
import type { ProjectScan } from '@harbour/domain'
import type { RepoInspection, RepoInspectionError } from '@harbour/git'

export type ProjectRepoResult =
  | {
      project: string
      repo: RepoInspection
      scan: ProjectScan | null
    }
  | {
      project: string
      error: RepoInspectionError
    }

export type CliOutput = {
  config: {
    configPath: string
  }
  repos: ProjectRepoResult[]
}

type CliError = {
  _tag?: string
  configPath?: string
  repoPath?: string
  issues?: HarbourConfigIssue[]
  message?: string
}

export function formatCliOutput(output: CliOutput) {
  return output.repos.map(formatProjectRepoResult).join('\n\n')
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

function formatProjectRepoResult(result: ProjectRepoResult) {
  if ('error' in result) {
    return [result.project, `  error: ${result.error._tag}`].join('\n')
  }

  const lines = [
    result.project,
    `  repo: ${result.repo.kind}`,
    `  workspace: ${result.scan?.workspacePath ?? 'none'}`,
    `  modules: ${result.scan?.modules.length ?? 0}`,
  ]

  for (const module of result.scan?.modules ?? []) {
    lines.push(`    ${module.name}`)
  }

  return lines.join('\n')
}

function formatConfigIssue(issue: HarbourConfigIssue) {
  const location = issue.path.length > 0 ? issue.path.join('.') : 'root'
  return `    ${location}: ${issue.message}`
}
