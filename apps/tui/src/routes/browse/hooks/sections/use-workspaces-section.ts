import { useStore } from 'jotai'

import { openModules } from '../../../../actions/drilldown'
import { resetProjectScope } from '../../../../actions/store'
import { openWorkspaceRoot } from '../../../../actions/runtime'
import { useTuiServices } from '../../../../hooks/useTuiServices'
import type { WorkspaceRow } from '../../../../types/rows'

export function useWorkspacesSection() {
  const services = useTuiServices()
  const store = useStore()

  return {
    onBack: () => resetProjectScope(store),
    onOpenRow: (row: WorkspaceRow) => {
      if (row.hasModules) {
        void openModules(services, store, row.projectId, row.workspaceId)
        return
      }

      void openWorkspaceRoot(services, store, row)
    },
  }
}
