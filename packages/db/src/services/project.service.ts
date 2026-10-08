import { Context } from 'effect'

import type { ProjectServiceApi } from './project.types'

export class ProjectService extends Context.Service<
  ProjectService,
  ProjectServiceApi
>()('@harbr/db/ProjectService') {}
