import { Data } from 'effect'

export class TmuxCommandError extends Data.TaggedError('TmuxCommandError')<{
  message: string
}> {}

export class TmuxNotFoundError extends Data.TaggedError('TmuxNotFoundError') {}

export type TmuxError = TmuxCommandError | TmuxNotFoundError
