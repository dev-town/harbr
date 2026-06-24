import {
  openDefaultWorkspaceModules,
  openWorkspaces,
} from '../../../../actions/drilldown'
import { openProjectRoot } from '../../../../actions/runtime'
import { useTuiServices } from '../../../../hooks/useTuiServices'
import { tuiStore } from '../../../../store'
import type { ProjectRow } from '../../../../types/rows'

export function useProjectsSection() {
  const services = useTuiServices()

  return {
    onBack: () => services.renderer.destroy(),
    onOpenRow: (row: ProjectRow) => {
      if (row.hasWorkspaces) {
        void openWorkspaces(services, tuiStore, row.projectId)
        return
      }

      if (row.hasModules) {
        void openDefaultWorkspaceModules(services, tuiStore, row.projectId)
        return
      }

      void openProjectRoot(services, tuiStore, row)
    },
  }
}
