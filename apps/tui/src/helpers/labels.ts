export function capitalize(value: string) {
  return value[0]?.toUpperCase() + value.slice(1)
}

export function getPlaceholder(currentSection: string, actionsOpen = false) {
  if (actionsOpen) {
    return 'Filter actions'
  }

  if (currentSection === 'modules') {
    return 'Filter modules'
  }

  if (currentSection === 'workspaces') {
    return 'Filter workspaces'
  }

  return 'Filter projects'
}
