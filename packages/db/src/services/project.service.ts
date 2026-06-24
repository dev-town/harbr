import { Context } from 'effect'

import type { ProjectServiceApi } from '../db.types'

export class ProjectService extends Context.Tag('@harbr/db/ProjectService')<
  ProjectService,
  ProjectServiceApi
>() {}
