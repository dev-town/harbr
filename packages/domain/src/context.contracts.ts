import { z } from 'zod'

export const HarbourContextSchema = z.object({
  moduleId: z.string().optional(),
  projectId: z.string().optional(),
  workspaceId: z.string().optional(),
})

export type HarbourContext = z.infer<typeof HarbourContextSchema>
