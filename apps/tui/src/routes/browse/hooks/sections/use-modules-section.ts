import { openModuleRuntime } from '~/actions/runtime'
import { useTuiServices } from '~/hooks/useTuiServices'
import { tuiStore } from '~/store'
import type { ModuleRow } from '~/types/rows'

export function useModulesSection() {
  const services = useTuiServices()

  return {
    onBack: () => {
      tuiStore.getState().resetWorkspaceScope()
    },
    onOpenRow: (row: ModuleRow) => {
      void openModuleRuntime(services, tuiStore, row)
    },
  }
}
