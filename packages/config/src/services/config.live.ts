import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

import type { ModuleSelector, ProjectConfig } from '@harbour/domain'
import { Effect, Layer } from 'effect'
import {
  ConfigNotFoundError,
  ConfigReadError,
  InvalidConfigError,
  InvalidJsonError,
} from '../config.errors'
import type { HarbourConfigError, HarbourConfigIssue } from '../config.errors'
import {
  normalizeModuleSelector,
  isWithinParent,
  mapSchemaIssue,
} from '../config.normalize'
import { getDefaultConfigPath, resolveTopLevelPath } from '../config.path'
import { configSchema, type HarbourConfigInput } from '../schema'
import { ConfigService, type ConfigServiceApi } from './config.service'
import type { HarbourConfig } from '../config.types'

export function loadConfig() {
  return Effect.flatMap(ConfigService, (service) => service.load).pipe(
    Effect.provide(makeConfigServiceLayer()),
  )
}

export function loadConfigAtPath(configPath: string) {
  return Effect.flatMap(ConfigService, (service) =>
    service.loadAtPath(configPath),
  ).pipe(Effect.provide(makeConfigServiceLayer()))
}

export function makeConfigServiceLayer(defaultConfigPath = getDefaultConfigPath()) {
  return Layer.succeed(ConfigService, {
    load: loadConfigFile(defaultConfigPath),
    loadAtPath: loadConfigFile,
  } satisfies ConfigServiceApi)
}

function loadConfigFile(configPath: string) {
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

    for (const [projectIndex, project] of parsedConfig.data.projects.entries()) {
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
  }) as Effect.Effect<HarbourConfig, HarbourConfigError>
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
