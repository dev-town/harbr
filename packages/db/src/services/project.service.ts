import { Context } from 'effect'

import type { ProjectServiceApi } from './project.types'

export class ProjectService extends Context.Tag('@harbr/db/ProjectService')<
  ProjectService,
  ProjectServiceApi
>() {}
