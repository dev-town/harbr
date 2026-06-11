import path from 'node:path'

import { z } from 'zod'

export const moduleSelectorSchema = z
  .string()
  .trim()
  .min(1, 'module selector required')

export const windowPaneSchema = z.object({
  name: z.string().trim().min(1, 'pane name required'),
  command: z
    .union([z.string().trim().min(1), z.array(z.string().trim().min(1)).min(1)])
    .optional(),
  cwd: z.string().trim().min(1).optional(),
})

export const windowSchema = z
  .object({
    name: z.string().trim().min(1, 'window name required'),
    panes: z.array(windowPaneSchema).min(1, 'window needs at least one pane'),
  })
  .superRefine((window, ctx) => {
    const seenPanes = new Set<string>()

    for (const [paneIndex, pane] of window.panes.entries()) {
      if (seenPanes.has(pane.name)) {
        ctx.addIssue({
          code: 'custom',
          path: ['panes', paneIndex, 'name'],
          message: `duplicate pane name: ${pane.name}`,
          params: {
            issueCode: 'duplicate_pane_name',
          },
        })
      }

      seenPanes.add(pane.name)
    }
  })

export const projectSchema = z.object({
  name: z.string().trim().min(1, 'project name required'),
  repo: z.string().trim().min(1, 'project repo required'),
  modules: z
    .array(moduleSelectorSchema)
    .min(1, 'project needs at least one module when modules is defined')
    .optional(),
  windows: z
    .array(z.union([z.string().trim().min(1), windowSchema]))
    .optional(),
})

export const configSchema = z
  .object({
    $schema: z.string().trim().min(1).optional(),
    windows: z.array(windowSchema).optional(),
    projects: z.array(projectSchema),
  })
  .superRefine((config, ctx) => {
    const seenProjects = new Set<string>()
    const seenWindows = new Set<string>()

    for (const [windowIndex, window] of (config.windows ?? []).entries()) {
      if (seenWindows.has(window.name)) {
        ctx.addIssue({
          code: 'custom',
          path: ['windows', windowIndex, 'name'],
          message: `duplicate window name: ${window.name}`,
          params: {
            issueCode: 'duplicate_window_name',
          },
        })
      }

      seenWindows.add(window.name)
    }

    for (const [projectIndex, project] of config.projects.entries()) {
      if (seenProjects.has(project.name)) {
        ctx.addIssue({
          code: 'custom',
          path: ['projects', projectIndex, 'name'],
          message: `duplicate project name: ${project.name}`,
          params: {
            issueCode: 'duplicate_project_name',
          },
        })
      }

      seenProjects.add(project.name)

      for (const [moduleIndex, moduleSelector] of (
        project.modules ?? []
      ).entries()) {
        if (moduleSelector === '/') {
          ctx.addIssue({
            code: 'custom',
            path: ['projects', projectIndex, 'modules', moduleIndex],
            message:
              'module selector `/` is not supported; use `.` for repo root',
            params: {
              issueCode: 'module_path_not_relative',
            },
          })
          continue
        }

        if (path.isAbsolute(moduleSelector)) {
          ctx.addIssue({
            code: 'custom',
            path: ['projects', projectIndex, 'modules', moduleIndex],
            message: `module selector must be repo-relative: ${moduleSelector}`,
            params: {
              issueCode: 'module_path_not_relative',
            },
          })
        }
      }
    }
  })

export type HarbourModuleSelectorInput = z.infer<typeof moduleSelectorSchema>
export type HarbourProjectInput = z.infer<typeof projectSchema>
export type HarbourConfigInput = z.infer<typeof configSchema>
