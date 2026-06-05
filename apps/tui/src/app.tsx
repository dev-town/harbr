import { useAppShell } from './hooks/useAppShell'
import { FooterRow, NoticeLine, Shell } from './components'
import { SurfaceFocusManager } from './keymap/layers'

export function App() {
  const { notice } = useAppShell()

  return (
    <box flexDirection="column" height="100%" padding={1} width="100%">
      <SurfaceFocusManager />
      <box flexGrow={1}>
        <Shell />
      </box>
      {notice ? <NoticeLine notice={notice} /> : null}
    </box>
  )
}
