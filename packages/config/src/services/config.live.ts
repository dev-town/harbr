import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

import type { ModuleSelector, WindowConfig } from '@harbr/domain'
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
import {
  ConfigService,
  ConfigServiceOptions,
  type ConfigServiceApi,
} from './config.service'
import type { HarbourConfig, HarbourProject } from '../config.types'

export const ConfigServiceOptionsLive = Layer.succeed(ConfigServiceOptions, {
  defaultConfigPath: getDefaultConfigPath(),
})

export const ConfigServiceLive = Layer.effect(
  ConfigService,
  Effect.map(
    ConfigServiceOptions,
    ({ defaultConfigPath }) =>
      ({
        load: loadConfigFile(defaultConfigPath),
        loadAtPath: loadConfigFile,
      }) satisfies ConfigServiceApi,
  ),
)

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

    const windows = parsedConfig.data.windows ?? []
    const projects: HarbourProject[] = []
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

      for (const [moduleIndex, moduleSelector] of (
        project.modules ?? []
      ).entries()) {
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

      const projectWindows = resolveProjectWindows({
        globalWindows: windows,
        project,
        projectIndex,
        projectName: project.name,
        issues,
      })

      projects.push({
        name: project.name,
        repo: repoPath,
        modules,
        windows: projectWindows,
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
  }).pipe(
    Effect.withSpan('config.load', {
      attributes: {
        'config.path': resolvedConfigPath,
      },
    }),
  ) as Effect.Effect<HarbourConfig, HarbourConfigError>
}

function resolveProjectWindows(input: {
  globalWindows: readonly WindowConfig[]
  issues: HarbourConfigIssue[]
  project: HarbourConfigInput['projects'][number]
  projectIndex: number
  projectName: string
}) {
  const windows = input.project.windows ?? input.globalWindows
  const resolvedWindows: WindowConfig[] = []
  const seenWindows = new Set<string>()

  for (const [windowIndex, window] of windows.entries()) {
    if (typeof window === 'string') {
      const resolvedWindow = resolveGlobalWindow(input.globalWindows, window)

      if (!resolvedWindow) {
        input.issues.push({
          code: 'unknown_window_ref',
          path: ['projects', input.projectIndex, 'windows', windowIndex],
          message: `unknown window ref: ${window}`,
          projectName: input.projectName,
          value: window,
        })
        continue
      }

      appendResolvedWindow({
        issues: input.issues,
        projectIndex: input.projectIndex,
        projectName: input.projectName,
        resolvedWindows,
        seenWindows,
        window: resolvedWindow,
        windowIndex,
      })
      continue
    }

    appendResolvedWindow({
      issues: input.issues,
      projectIndex: input.projectIndex,
      projectName: input.projectName,
      resolvedWindows,
      seenWindows,
      window,
      windowIndex,
    })
  }

  return resolvedWindows
}

function appendResolvedWindow(input: {
  issues: HarbourConfigIssue[]
  projectIndex: number
  projectName: string
  resolvedWindows: WindowConfig[]
  seenWindows: Set<string>
  window: WindowConfig
  windowIndex: number
}) {
  if (input.seenWindows.has(input.window.name)) {
    input.issues.push({
      code: 'duplicate_window_name',
      path: ['projects', input.projectIndex, 'windows', input.windowIndex],
      message: `duplicate window name: ${input.window.name}`,
      projectName: input.projectName,
      value: input.window.name,
    })
    return
  }

  input.seenWindows.add(input.window.name)
  input.resolvedWindows.push(input.window)
}

function resolveGlobalWindow(
  globalWindows: readonly WindowConfig[],
  windowName: string,
) {
  return globalWindows.find((window) => window.name === windowName) ?? null
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
