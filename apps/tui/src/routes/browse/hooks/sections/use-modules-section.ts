import { useSetAtom, useStore } from 'jotai'

import { resetWorkspaceScope } from '../../../../actions/store'
import { openModuleRuntime } from '../../../../actions/runtime'
import { useTuiServices } from '../../../../hooks/useTuiServices'
import type { ModuleRow } from '../../../../types/rows'
import {
  browseSectionAtom,
  selectedProjectIdAtom,
  selectedWorkspaceImplicitAtom,
} from '../../atoms'

export function useModulesSection() {
  const services = useTuiServices()
  const store = useStore()
  const setBrowseSection = useSetAtom(browseSectionAtom)
  const setSelectedProjectId = useSetAtom(selectedProjectIdAtom)

  return {
    onBack: () => {
      if (store.get(selectedWorkspaceImplicitAtom)) {
        setBrowseSection('projects')
        setSelectedProjectId(null)
      } else {
        setBrowseSection('workspaces')
      }

      resetWorkspaceScope(store)
    },
    onOpenRow: (row: ModuleRow) => {
      void openModuleRuntime(services, store, row)
    },
  }
}
