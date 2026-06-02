export function validateWorkspaceName(value: string) {
  const trimmedValue = value.trim()

  if (trimmedValue.length === 0) {
    return 'Workspace name is required'
  }

  if (trimmedValue === '.' || trimmedValue === '..') {
    return 'Workspace name is not valid'
  }

  if (/\s/.test(trimmedValue) || /[\\/]/.test(trimmedValue)) {
    return 'No spaces or slashes'
  }

  if (/[:*?"<>|]/.test(trimmedValue)) {
    return 'Workspace name contains invalid characters'
  }

  if (trimmedValue.endsWith('.')) {
    return 'Workspace name cannot end with .'
  }

  return null
}

export function validateBranchName(value: string) {
  const trimmedValue = value.trim()

  if (trimmedValue.length === 0) {
    return 'Branch name is required'
  }

  if (trimmedValue.startsWith('-')) {
    return 'Branch name cannot start with -'
  }

  if (
    /\s/.test(trimmedValue) ||
    ['~', '^', ':', '?', '*', '[', '\\'].some((character) =>
      trimmedValue.includes(character),
    )
  ) {
    return 'Branch name contains invalid characters'
  }

  if (
    trimmedValue.includes('..') ||
    trimmedValue.includes('//') ||
    trimmedValue.includes('@{') ||
    trimmedValue.endsWith('.') ||
    trimmedValue.endsWith('/')
  ) {
    return 'Branch name is not valid'
  }

  return null
}
