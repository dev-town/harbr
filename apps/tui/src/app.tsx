import { useEffect } from 'react'
import { useAtomValue } from 'jotai'

import type { TuiAppContext } from './app-context'
import { clampSelectedIndex, loadInitialProjects } from './actions'
import { HarbourPopover } from './components'
import { visibleRowsAtom } from './state'

export function App({ context }: { context: TuiAppContext }) {
  const rows = useAtomValue(visibleRowsAtom)

  useEffect(() => {
    void loadInitialProjects(context)
  }, [context])

  useEffect(() => {
    clampSelectedIndex(context, rows.length)
  }, [context, rows.length])

  return (
    <box flexDirection="column" height="100%" padding={1} width="100%">
      <box flexGrow={1}>
        <HarbourPopover />
      </box>
    </box>
  )
}
