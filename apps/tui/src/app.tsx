import { useAppShell } from './hooks/useAppShell'
import { Browser, FooterRow, NoticeLine } from './components'
import { SurfaceFocusManager } from './keymap/layers'

export function App() {
  const { notice } = useAppShell()

  return (
    <box flexDirection="column" height="100%" padding={1} width="100%">
      <SurfaceFocusManager />
      <box flexGrow={1}>
        <Browser />
      </box>
      {notice ? <NoticeLine notice={notice} /> : null}
      <FooterRow />
    </box>
  )
}
