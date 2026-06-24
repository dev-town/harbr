import { Context } from 'effect'

import type { DatabaseClientApi } from '../db.types'

export class DatabaseClient extends Context.Tag('@harbr/db/DatabaseClient')<
  DatabaseClient,
  DatabaseClientApi
>() {}
