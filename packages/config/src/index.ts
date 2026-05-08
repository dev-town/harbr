import { readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

import type { ModuleSelector, ProjectConfig } from '@harbour/domain'
import { Effect } from 'effect'
import type { ZodIssue } from 'zod'
import {
  ConfigNotFoundError,
  ConfigReadError,
  InvalidConfigError,
  InvalidJsonError,
} from './errors'
import type { HarbourConfigIssue, HarbourConfigIssueCode } from './errors'
import { configSchema, type HarbourConfigInput } from './schema'

export type {
  HarbourConfigInput,
  HarbourModuleSelectorInput,
  HarbourProjectInput,
} from './schema'
export {
  ConfigNotFoundError,
  ConfigReadError,
  InvalidConfigError,
  InvalidJsonError,
} from './errors'
export type {
  HarbourConfigError,
  HarbourConfigIssue,
  HarbourConfigIssueCode,
} from './errors'

export type HarbourModuleSelector = ModuleSelector
export type HarbourProject = ProjectConfig

export type HarbourConfig = {
  $schema?: string
  configPath: string
  projects: ProjectConfig[]
}

export function getDefaultConfigPath() {
  return path.join(homedir(), '.config', 'harbour', 'config.json')
}

export function loadConfig() {
  return loadConfigAtPath(getDefaultConfigPath())
}

export function loadConfigAtPath(configPath: string) {
  const resolvedConfigPath = resolveTopLevelPath(configPath)

  return Effect.gen(function* () {
    const configExists = yield* Effect.promise(() =>
      pathExists(resolvedConfigPath),
    )

    if (!configExists) {
      return yield* Effect.fail(
        new ConfigNotFoundError({
          configPath: resolvedConfigPath,
        }),
      )
    }

    const rawConfig = yield* Effect.tryPromise({
      try: () => readFile(resolvedConfigPath, 'utf8'),
      catch: (error) =>
        new ConfigReadError({
          configPath: resolvedConfigPath,
          message: error instanceof Error ? error.message : String(error),
        }),
    })

    const configInput = yield* Effect.try({
      try: () => JSON.parse(rawConfig) as HarbourConfigInput,
      catch: (error) =>
        new InvalidJsonError({
          configPath: resolvedConfigPath,
          message: error instanceof Error ? error.message : String(error),
        }),
    })

    const parsedConfig = configSchema.safeParse(configInput)

    if (!parsedConfig.success) {
      return yield* Effect.fail(
        new InvalidConfigError({
          configPath: resolvedConfigPath,
          issues: parsedConfig.error.issues.map(mapSchemaIssue),
        }),
      )
    }

    const projects: ProjectConfig[] = []
    const issues: HarbourConfigIssue[] = []

    for (const [
      projectIndex,
      project,
    ] of parsedConfig.data.projects.entries()) {
      const repoPath = resolveTopLevelPath(project.repo)

      if (!(yield* Effect.promise(() => isDirectory(repoPath)))) {
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
        const absoluteModulePath = path.resolve(
          repoPath,
          normalizedSelector.path,
        )

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
      return yield* Effect.fail(
        new InvalidConfigError({
          configPath: resolvedConfigPath,
          issues,
        }),
      )
    }

    return {
      configPath: resolvedConfigPath,
      projects,
      ...(parsedConfig.data.$schema
        ? { $schema: parsedConfig.data.$schema }
        : {}),
    } satisfies HarbourConfig
  })
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

async function pathExists(targetPath: string) {
  try {
    await stat(targetPath)
    return true
  } catch {
    return false
  }
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

function mapSchemaIssue(issue: ZodIssue): HarbourConfigIssue {
  return {
    code: getSchemaIssueCode(issue),
    path: issue.path.map((segment) =>
      typeof segment === 'symbol' ? String(segment) : segment,
    ),
    message: issue.message,
  }
}
