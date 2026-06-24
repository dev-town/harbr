export function formatError(error: unknown) {
  if (isTaggedError(error, 'InvalidBranchNameError')) {
    return 'Branch name is not a valid Git branch name'
  }

  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

function isTaggedError(error: unknown, tag: string): error is { _tag: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    '_tag' in error &&
    error._tag === tag
  )
}
