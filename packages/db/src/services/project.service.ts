import { Context } from 'effect'

import type { ProjectServiceApi } from '../db.types'

export class ProjectService extends Context.Tag('@harbour/db/ProjectService')<
  ProjectService,
  ProjectServiceApi
>() {}
