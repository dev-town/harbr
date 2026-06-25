import { Context } from 'effect'

import type { DatabaseClientApi } from '../db.types'

export type DatabaseClientOptionsApi = {
  readonly dbPath: string
}

export class DatabaseClientOptions extends Context.Tag(
  '@harbr/db/DatabaseClientOptions',
)<DatabaseClientOptions, DatabaseClientOptionsApi>() {}

export class DatabaseClient extends Context.Tag('@harbr/db/DatabaseClient')<
  DatabaseClient,
  DatabaseClientApi
>() {}
