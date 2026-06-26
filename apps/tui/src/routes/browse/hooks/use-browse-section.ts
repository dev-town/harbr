import type { HarbourRow } from '~/types/rows'
import { selectCurrentBrowseSection, useTuiStore } from '~/store'
import { useModulesSection } from './sections/use-modules-section'
import { useProjectsSection } from './sections/use-projects-section'
import { useWorkspacesSection } from './sections/use-workspaces-section'

export function useBrowseSection() {
  const currentSection = useTuiStore(selectCurrentBrowseSection)
  const projectsSection = useProjectsSection()
  const workspacesSection = useWorkspacesSection()
  const modulesSection = useModulesSection()

  if (currentSection === 'workspaces') {
    return {
      currentSection,
      onBack: workspacesSection.onBack,
      onOpenRow: (row: HarbourRow) => {
        if (row.kind !== 'workspace') {
          return
        }

        workspacesSection.onOpenRow(row)
      },
    }
  }

  if (currentSection === 'modules') {
    return {
      currentSection,
      onBack: modulesSection.onBack,
      onOpenRow: (row: HarbourRow) => {
        if (row.kind !== 'module') {
          return
        }

        modulesSection.onOpenRow(row)
      },
    }
  }

  return {
    currentSection,
    onBack: projectsSection.onBack,
    onOpenRow: (row: HarbourRow) => {
      if (row.kind !== 'project') {
        return
      }

      projectsSection.onOpenRow(row)
    },
  }
}
