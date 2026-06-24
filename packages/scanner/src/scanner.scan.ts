import { readdir } from 'node:fs/promises'
import path from 'node:path'

import type { ProjectConfig, ProjectScan, ResolvedModule } from '@harbr/domain'
import { Effect } from 'effect'

export function scanProject(project: ProjectConfig, workspacePath: string) {
  const resolvedWorkspacePath = path.resolve(workspacePath)

  return Effect.map(
    resolveProjectModules(project, resolvedWorkspacePath),
    (modules) =>
      ({
        projectName: project.name,
        repoPath: project.repo,
        workspacePath: resolvedWorkspacePath,
        modules,
      }) satisfies ProjectScan,
  )
}

export function resolveProjectModules(
  project: ProjectConfig,
  workspacePath: string,
) {
  const resolvedWorkspacePath = path.resolve(workspacePath)

  return Effect.map(
    Effect.all(
      project.modules.map((selector) =>
        selector.mode === 'explicit'
          ? Effect.succeed([
              resolveExplicitModule(selector, resolvedWorkspacePath),
            ])
          : resolveChildModules(selector, resolvedWorkspacePath),
      ),
    ),
    (modules) => modules.flat(),
  )
}

function resolveExplicitModule(
  selector: ProjectConfig['modules'][number],
  workspacePath: string,
): ResolvedModule {
  if (selector.path === '.') {
    return {
      name: '/',
      path: '.',
      workspacePath,
      selector,
    }
  }

  return {
    name: selector.path,
    path: selector.path,
    workspacePath: path.join(workspacePath, selector.path),
    selector,
  }
}

function resolveChildModules(
  selector: ProjectConfig['modules'][number],
  workspacePath: string,
) {
  const selectorPath = path.join(workspacePath, selector.path)

  return Effect.promise(async () => {
    try {
      const entries = await readdir(selectorPath, { withFileTypes: true })

      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => {
          const modulePath = path.join(selector.path, entry.name)

          return {
            name: modulePath,
            path: modulePath,
            workspacePath: path.join(selectorPath, entry.name),
            selector,
          } satisfies ResolvedModule
        })
        .sort((left, right) => left.path.localeCompare(right.path))
    } catch {
      return [] satisfies ResolvedModule[]
    }
  })
}
