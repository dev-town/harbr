export const harbourCommandIds = {
  appQuit: 'app.quit',
  surfaceBack: 'surface.back',
  surfaceDown: 'surface.down',
  surfaceOpenActions: 'surface.open_actions',
  surfaceRefresh: 'surface.refresh',
  surfaceSelect: 'surface.select',
  surfaceToggleVisibility: 'surface.toggle_visibility',
  surfaceUp: 'surface.up',
} as const

export type HarbourCommandId =
  (typeof harbourCommandIds)[keyof typeof harbourCommandIds]

export const harbourCommandBindings = [
  { key: 'up', cmd: harbourCommandIds.surfaceUp },
  { key: 'down', cmd: harbourCommandIds.surfaceDown },
  { key: 'return', cmd: harbourCommandIds.surfaceSelect },
  { key: 'tab', cmd: harbourCommandIds.surfaceToggleVisibility },
  { key: 'escape', cmd: harbourCommandIds.surfaceBack },
  { key: 'ctrl+r', cmd: harbourCommandIds.surfaceRefresh },
  { key: 'ctrl+a', cmd: harbourCommandIds.surfaceOpenActions },
  { key: '?', cmd: harbourCommandIds.surfaceOpenActions },
  { key: 'ctrl+c', cmd: harbourCommandIds.appQuit },
] satisfies readonly { key: string; cmd: HarbourCommandId }[]
