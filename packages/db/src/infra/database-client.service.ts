import { Context } from 'effect'

import type { DatabaseClientApi } from '../db.types'

export type DatabaseClientOptionsApi = {
  readonly dbPath: string
}

export class DatabaseClientOptions extends Context.Service<
  DatabaseClientOptions,
  DatabaseClientOptionsApi
>()('@harbr/db/DatabaseClientOptions') {}

export class DatabaseClient extends Context.Service<
  DatabaseClient,
  DatabaseClientApi
>()('@harbr/db/DatabaseClient') {}
