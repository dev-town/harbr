import { z } from 'zod'

export const WindowPaneConfigSchema = z.object({
  command: z.union([z.string(), z.array(z.string())]).optional(),
  cwd: z.string().optional(),
  name: z.string(),
})
export type WindowPaneConfig = z.infer<typeof WindowPaneConfigSchema>

export const WindowConfigSchema = z.object({
  name: z.string(),
  panes: z.array(WindowPaneConfigSchema),
})
export type WindowConfig = z.infer<typeof WindowConfigSchema>
