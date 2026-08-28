import type { RuntimeIdentity } from '@harbr/domain'

export function getCloseRuntimeLabel(identity: RuntimeIdentity) {
  return identity.source.provider === 'herdr'
    ? 'Close workspace'
    : 'Close session'
}

export function getCannotCloseCurrentRuntimeNotice(identity: RuntimeIdentity) {
  return identity.source.provider === 'herdr'
    ? 'Cannot close current workspace'
    : 'Cannot close current session'
}
