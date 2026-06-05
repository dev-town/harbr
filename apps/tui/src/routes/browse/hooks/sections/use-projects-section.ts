import { useStore } from 'jotai'

import { openDefaultWorkspaceModules, openWorkspaces } from '../../../../actions/drilldown'
import { openProjectRoot } from '../../../../actions/runtime'
import { useTuiServices } from '../../../../hooks/useTuiServices'
import type { ProjectRow } from '../../../../types/rows'

export function useProjectsSection() {
  const services = useTuiServices()
  const store = useStore()

  return {
    onBack: () => services.renderer.destroy(),
    onOpenRow: (row: ProjectRow) => {
      if (row.hasWorkspaces) {
        void openWorkspaces(services, store, row.projectId)
        return
      }

      if (row.hasModules) {
        void openDefaultWorkspaceModules(services, store, row.projectId)
        return
      }

      void openProjectRoot(services, store, row)
    },
  }
}
