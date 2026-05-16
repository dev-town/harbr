import { Context } from 'effect'

import type { DatabaseClientApi } from '../db.types'

export class DatabaseClient extends Context.Tag('@harbour/db/DatabaseClient')<
  DatabaseClient,
  DatabaseClientApi
>() {}
