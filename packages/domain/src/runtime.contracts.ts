import { z } from 'zod'

import { RuntimeScopeSchema, RuntimeStatusSchema } from './shared.contracts'

export const RuntimeFactSchema = z.object({
  moduleName: z.string().nullable(),
  projectName: z.string(),
  scope: RuntimeScopeSchema,
  sessionName: z.string(),
  status: RuntimeStatusSchema,
  workspaceName: z.string().nullable(),
})

export type RuntimeFact = z.infer<typeof RuntimeFactSchema>
