import type { RuntimeFact, RuntimeTarget } from '@harbr/domain'

const encodedSeparator = '~~'

export function parseSessionName(sessionName: string): RuntimeFact | null {
  if (sessionName.length === 0) {
    return null
  }

  if (sessionName.includes(encodedSeparator)) {
    return parseEncodedSessionName(sessionName)
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

export function formatSessionName(target: Omit<RuntimeTarget, 'cwd'>) {
  return [target.projectName, target.workspaceName, target.moduleName]
    .filter((part): part is string => part !== null)
    .map(encodeSessionSegment)
    .join(encodedSeparator)
}

export function findMatchingRuntime(
  runtimes: readonly RuntimeFact[],
  target: Omit<RuntimeTarget, 'cwd'>,
) {
  return (
    runtimes.find(
      (runtime) =>
        runtime.projectName === target.projectName &&
        runtime.workspaceName === target.workspaceName &&
        runtime.moduleName === target.moduleName,
    ) ?? null
  )
}

export function formatSessionTarget(sessionName: string) {
  return `=${sessionName}`
}

function parseEncodedSessionName(sessionName: string) {
  if (sessionName.endsWith(encodedSeparator)) {
    return null
  }

  const parts = splitIntoAtMostThreeParts(sessionName, encodedSeparator)

  if (!parts || parts.some((part) => part.length === 0)) {
    return null
  }

  const decodedParts = decodeSessionParts(parts)

  if (!decodedParts) {
    return null
  }

  return buildRuntimeFact(sessionName, decodedParts)
}

function buildRuntimeFact(sessionName: string, parts: readonly string[]) {
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

function encodeSessionSegment(value: string) {
  return value.replaceAll(
    /[~:.%]/g,
    (match) => `~${match.charCodeAt(0).toString(16)}`,
  )
}

function decodeSessionParts(parts: readonly string[]) {
  try {
    return parts.map(decodeSessionSegment)
  } catch {
    return null
  }
}

function decodeSessionSegment(value: string) {
  let decoded = ''

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]

    if (character !== '~') {
      decoded += character
      continue
    }

    const encodedByte = value.slice(index + 1, index + 3)

    if (!/^[0-9a-f]{2}$/i.test(encodedByte)) {
      throw new Error(`invalid encoded session segment: ${value}`)
    }

    decoded += String.fromCharCode(Number.parseInt(encodedByte, 16))
    index += 2
  }

  return decoded
}

function splitIntoAtMostThreeParts(value: string, separator: string) {
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
