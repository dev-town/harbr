import { Data } from 'effect'

import type { RuntimeProvider } from '@harbr/domain'

export class RuntimeProviderError extends Data.TaggedError('RuntimeProviderError')<{
  readonly message: string
  readonly operation: string
  readonly provider: RuntimeProvider
}> {}
