import type { RuntimeFact } from '@harbour/domain'

export function parseSessionName(sessionName: string): RuntimeFact | null {
  if (sessionName.length === 0) {
    return null
  }

  if (sessionName.includes('__')) {
    return parseBySeparator(sessionName, '__')
  }

  if (sessionName.includes('/')) {
    return parseBySeparator(sessionName, '/')
  }

  return {
    sessionName,
    scope: 'project',
    projectName: sessionName,
    workspaceName: null,
    moduleName: null,
    status: 'open',
  }
}

function parseBySeparator(sessionName: string, separator: '/' | '__') {
  if (sessionName.endsWith(separator)) {
    return null
  }

  const parts = splitIntoAtMostThreeParts(sessionName, separator)

  if (!parts || parts.some((part) => part.length === 0)) {
    return null
  }

  const projectName = parts[0]!

  if (parts.length === 1) {
    return {
      sessionName,
      scope: 'project',
      projectName,
      workspaceName: null,
      moduleName: null,
      status: 'open',
    } satisfies RuntimeFact
  }

  const workspaceName = parts[1]!

  if (parts.length === 2) {
    return {
      sessionName,
      scope: 'workspace',
      projectName,
      workspaceName,
      moduleName: null,
      status: 'open',
    } satisfies RuntimeFact
  }

  const moduleName = parts[2]!

  return {
    sessionName,
    scope: 'module',
    projectName,
    workspaceName,
    moduleName,
    status: 'open',
  } satisfies RuntimeFact
}

function splitIntoAtMostThreeParts(value: string, separator: '/' | '__') {
  const firstSeparatorIndex = value.indexOf(separator)

  if (firstSeparatorIndex < 0) {
    return [value]
  }

  const projectName = value.slice(0, firstSeparatorIndex)
  const rest = value.slice(firstSeparatorIndex + separator.length)
  const secondSeparatorIndex = rest.indexOf(separator)

  if (secondSeparatorIndex < 0) {
    return [projectName, rest]
  }

  return [
    projectName,
    rest.slice(0, secondSeparatorIndex),
    rest.slice(secondSeparatorIndex + separator.length),
  ]
}
