import { openModules } from '../../../../actions/drilldown'
import { openWorkspaceRoot } from '../../../../actions/runtime'
import { useTuiServices } from '../../../../hooks/useTuiServices'
import { tuiStore } from '../../../../store'
import type { WorkspaceRow } from '../../../../types/rows'

export function useWorkspacesSection() {
  const services = useTuiServices()

  return {
    onBack: () => tuiStore.getState().resetProjectScope(),
    onOpenRow: (row: WorkspaceRow) => {
      if (row.hasModules) {
        void openModules(services, tuiStore, row.projectId, row.workspaceId)
        return
      }

      void openWorkspaceRoot(services, tuiStore, row)
    },
  }
}
