import type { RuntimeTarget } from '@harbr/domain'

export function formatHerdrWorkspaceLabel(target: Omit<RuntimeTarget, 'cwd'>) {
  return [target.projectName, target.workspaceName, target.moduleName]
    .filter((part): part is string => part !== null)
    .join(' › ')
}
