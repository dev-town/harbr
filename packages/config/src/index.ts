import { access, readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

import type { ModuleSelector, ProjectConfig } from '@harbour/domain'
import { z } from 'zod'
import { configSchema, type HarbourConfigInput } from './schema'

export type {
  HarbourConfigInput,
  HarbourModuleSelectorInput,
  HarbourProjectInput,
} from './schema'

export type HarbourModuleSelector = ModuleSelector
export type HarbourProject = ProjectConfig

export type HarbourConfig = {
  $schema?: string
  configPath: string
  projects: ProjectConfig[]
}

export type HarbourConfigIssueCode =
  | 'duplicate_project_name'
  | 'module_path_not_relative'
  | 'repo_not_found'
  | 'schema'

export type HarbourConfigIssue = {
  code: HarbourConfigIssueCode
  path: (string | number)[]
  message: string
  projectName?: string
  value?: string
}

export type HarbourConfigError =
  | {
      code: 'config_not_found'
      configPath: string
    }
  | {
      code: 'invalid_json'
      configPath: string
      message: string
    }
  | {
      code: 'invalid_config'
      configPath: string
      issues: HarbourConfigIssue[]
    }

export type HarbourConfigResult =
  | {
      ok: true
      value: HarbourConfig
    }
  | {
      ok: false
      error: HarbourConfigError
    }

type ParsedConfigResult =
  | {
      ok: true
      value: HarbourConfigInput
    }
  | {
      ok: false
      error: Extract<HarbourConfigError, { code: 'invalid_json' }>
    }

export function getDefaultConfigPath() {
  return path.join(homedir(), '.config', 'harbour', 'config.json')
}

export async function loadConfig() {
  return loadConfigAtPath(getDefaultConfigPath())
}

export async function loadConfigAtPath(
  configPath: string,
): Promise<HarbourConfigResult> {
  const resolvedConfigPath = resolveTopLevelPath(configPath)

  try {
    await access(resolvedConfigPath)
  } catch {
    return {
      ok: false,
      error: {
        code: 'config_not_found',
        configPath: resolvedConfigPath,
      },
    }
  }

  const rawConfig = await readConfigFile(resolvedConfigPath)

  if (!rawConfig.ok) {
    return rawConfig
  }

  const parsed = configSchema.safeParse(rawConfig.value)

  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'invalid_config',
        configPath: resolvedConfigPath,
        issues: parsed.error.issues.map(mapSchemaIssue),
      },
    }
  }

  const projects: ProjectConfig[] = []
  const issues: HarbourConfigIssue[] = []

  for (const [projectIndex, project] of parsed.data.projects.entries()) {
    const repoPath = resolveTopLevelPath(project.repo)

    if (!(await isDirectory(repoPath))) {
      issues.push({
        code: 'repo_not_found',
        path: ['projects', projectIndex, 'repo'],
        message: `repo path not found: ${repoPath}`,
        projectName: project.name,
        value: repoPath,
      })
      continue
    }

    const modules: ModuleSelector[] = []

    for (const [moduleIndex, moduleSelector] of project.modules.entries()) {
      const normalizedSelector = normalizeModuleSelector(moduleSelector)
      const absoluteModulePath = path.resolve(repoPath, normalizedSelector.path)

      if (!isWithinParent(repoPath, absoluteModulePath)) {
        issues.push({
          code: 'module_path_not_relative',
          path: ['projects', projectIndex, 'modules', moduleIndex],
          message: `module selector escapes repo: ${moduleSelector}`,
          projectName: project.name,
          value: moduleSelector,
        })
        continue
      }

      modules.push({
        raw: moduleSelector,
        path: normalizedSelector.path,
        mode: normalizedSelector.mode,
      })
    }

    projects.push({
      name: project.name,
      repo: repoPath,
      modules,
    })
  }

  if (issues.length > 0) {
    return {
      ok: false,
      error: {
        code: 'invalid_config',
        configPath: resolvedConfigPath,
        issues,
      },
    }
  }

  return {
    ok: true,
    value: {
      configPath: resolvedConfigPath,
      projects,
      ...(parsed.data.$schema ? { $schema: parsed.data.$schema } : {}),
    },
  }
}

async function readConfigFile(configPath: string): Promise<ParsedConfigResult> {
  try {
    const raw = await readFile(configPath, 'utf8')

    return {
      ok: true,
      value: JSON.parse(raw) as HarbourConfigInput,
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        ok: false,
        error: {
          code: 'invalid_json',
          configPath,
          message: error.message,
        },
      }
    }

    throw error
  }
}

function resolveTopLevelPath(inputPath: string) {
  return path.resolve(expandHome(inputPath))
}

function expandHome(inputPath: string) {
  if (inputPath === '~') {
    return homedir()
  }

  if (inputPath.startsWith('~/')) {
    return path.join(homedir(), inputPath.slice(2))
  }

  return inputPath
}

function stripLeadingCurrentDir(inputPath: string) {
  if (inputPath === '.') {
    return inputPath
  }

  return inputPath.replace(/^\.\//, '')
}

function normalizeModuleSelector(selector: string) {
  const mode = selector.endsWith('/') ? 'children' : 'explicit'
  const trimmedSelector = mode === 'children' ? selector.slice(0, -1) : selector

  return {
    path: stripLeadingCurrentDir(path.normalize(trimmedSelector)),
    mode,
  } as const
}

function isWithinParent(parentPath: string, childPath: string) {
  const relativePath = path.relative(parentPath, childPath)

  return (
    relativePath === '' ||
    (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
  )
}

async function isDirectory(targetPath: string) {
  try {
    const targetStat = await stat(targetPath)
    return targetStat.isDirectory()
  } catch {
    return false
  }
}

function getSchemaIssueCode(issue: z.ZodIssue): HarbourConfigIssueCode {
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

function mapSchemaIssue(issue: z.ZodIssue): HarbourConfigIssue {
  return {
    code: getSchemaIssueCode(issue),
    path: issue.path.map((segment) =>
      typeof segment === 'symbol' ? String(segment) : segment,
    ),
    message: issue.message,
  }
}
