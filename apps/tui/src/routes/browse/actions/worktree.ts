import type { TuiServices, TuiStore } from '~/app-context'
import { handleWorktreeFormSubmit } from '~/actions/worktree'

export function handleBrowseWorktreeSubmit(
  services: TuiServices,
  store: TuiStore,
) {
  void handleWorktreeFormSubmit(services, store)
}
