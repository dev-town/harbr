import { useAppShell } from './hooks/useAppShell'
import { Shell } from './components'
import { SurfaceFocusManager } from './keymap/layers'
import { useRootKeybindings } from './keymap/root-keybindings'

export function App() {
  useAppShell()
  useRootKeybindings()

  return (
    <box flexDirection="column" height="100%" padding={1} width="100%">
      <SurfaceFocusManager />
      <box flexGrow={1}>
        <Shell />
      </box>
    </box>
  )
}
