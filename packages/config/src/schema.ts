import path from 'node:path'

import { z } from 'zod'

export const moduleSelectorSchema = z
  .string()
  .trim()
  .min(1, 'module selector required')

export const projectSchema = z.object({
  name: z.string().trim().min(1, 'project name required'),
  repo: z.string().trim().min(1, 'project repo required'),
  modules: z
    .array(moduleSelectorSchema)
    .min(1, 'project needs at least one module'),
})

export const configSchema = z
  .object({
    $schema: z.string().trim().min(1).optional(),
    projects: z.array(projectSchema),
  })
  .superRefine((config, ctx) => {
    const seenProjects = new Set<string>()

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

      for (const [moduleIndex, moduleSelector] of project.modules.entries()) {
        if (moduleSelector === '/') {
          ctx.addIssue({
            code: 'custom',
            path: ['projects', projectIndex, 'modules', moduleIndex],
            message: 'module selector `/` is not supported; use `.` for repo root',
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
