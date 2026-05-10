declare module 'better-sqlite3' {
  export default class Database {
    constructor(filename: string)
    close(): void
    pragma(statement: string): unknown
  }

  namespace Database {
    export interface Database {
      close(): void
      pragma(statement: string): unknown
    }
  }
}

declare module 'bun:sqlite' {
  export class Database {
    constructor(
      filename: string,
      options?: {
        create?: boolean
        strict?: boolean
      },
    )

    close(): void
    exec(sql: string): unknown
  }
}
