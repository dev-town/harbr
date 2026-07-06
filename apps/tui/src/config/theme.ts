import type { HarbourTheme } from '@harbr/config'
import type { ThemeMode } from '@opentui/core'

export type ThemeId = HarbourTheme

export type ThemeTokens = {
  backdrop: string
  modalBackdrop: string
  panel: string
  panelSoft: string
  border: string
  borderSoft: string
  text: string
  activeText: string
  muted: string
  accent: string
  active: string
  idle: string
  warning: string
  error: string
  violet: string
  selection: string
  selectionEdge: string
  search: string
}

export type ThemeModeReader = {
  waitForThemeMode: (timeoutMs?: number) => Promise<ThemeMode | null>
  setBackgroundColor?: (color: string) => void
}

export const themeIds = [
  'system',
  'tokyonight',
  'everforest',
  'ayu',
  'catppuccin',
  'catppuccin-macchiato',
  'gruvbox',
  'kanagawa',
  'nord',
  'atom-one-dark',
] as const satisfies readonly ThemeId[]

export const themeCatalog = {
  tokyonight: {
    backdrop: '#11121d',
    modalBackdrop: '#00000096',
    panel: '#1a1b26',
    panelSoft: '#24283b',
    border: '#7aa2f7',
    borderSoft: '#414868',
    text: '#c0caf5',
    activeText: '#ffffff',
    muted: '#565f89',
    accent: '#7aa2f7',
    active: '#9ece6a',
    idle: '#a9b1d6',
    warning: '#e0af68',
    error: '#f7768e',
    violet: '#bb9af7',
    selection: '#283457',
    selectionEdge: '#414868',
    search: '#16161e',
  },
  everforest: {
    backdrop: '#1e2326',
    modalBackdrop: '#00000096',
    panel: '#272e33',
    panelSoft: '#2e383c',
    border: '#a7c080',
    borderSoft: '#414b50',
    text: '#d3c6aa',
    activeText: '#fffbea',
    muted: '#859289',
    accent: '#7fbbb3',
    active: '#a7c080',
    idle: '#9da9a0',
    warning: '#dbbc7f',
    error: '#e67e80',
    violet: '#d699b6',
    selection: '#384b55',
    selectionEdge: '#4f5b58',
    search: '#1e2326',
  },
  ayu: {
    backdrop: '#0b0e14',
    modalBackdrop: '#00000096',
    panel: '#0f1419',
    panelSoft: '#131a21',
    border: '#59c2ff',
    borderSoft: '#2d3640',
    text: '#b3b1ad',
    activeText: '#f2f4f8',
    muted: '#5c6773',
    accent: '#59c2ff',
    active: '#aad94c',
    idle: '#b3b1ad',
    warning: '#ffb454',
    error: '#f07178',
    violet: '#d2a6ff',
    selection: '#253340',
    selectionEdge: '#384554',
    search: '#0b0e14',
  },
  catppuccin: {
    backdrop: '#11111b',
    modalBackdrop: '#00000096',
    panel: '#181825',
    panelSoft: '#1e1e2e',
    border: '#89b4fa',
    borderSoft: '#313244',
    text: '#cdd6f4',
    activeText: '#f5f7ff',
    muted: '#9399b2',
    accent: '#89b4fa',
    active: '#a6e3a1',
    idle: '#a6adc8',
    warning: '#f9e2af',
    error: '#f38ba8',
    violet: '#cba6f7',
    selection: '#313a5b',
    selectionEdge: '#45475a',
    search: '#11111b',
  },
  'catppuccin-macchiato': {
    backdrop: '#181926',
    modalBackdrop: '#00000096',
    panel: '#1e2030',
    panelSoft: '#24273a',
    border: '#8aadf4',
    borderSoft: '#363a4f',
    text: '#cad3f5',
    activeText: '#f4f7ff',
    muted: '#939ab7',
    accent: '#8aadf4',
    active: '#a6da95',
    idle: '#b8c0e0',
    warning: '#eed49f',
    error: '#ed8796',
    violet: '#c6a0f6',
    selection: '#33415f',
    selectionEdge: '#494d64',
    search: '#181926',
  },
  gruvbox: {
    backdrop: '#1d2021',
    modalBackdrop: '#00000096',
    panel: '#282828',
    panelSoft: '#32302f',
    border: '#83a598',
    borderSoft: '#504945',
    text: '#ebdbb2',
    activeText: '#fff7d5',
    muted: '#a89984',
    accent: '#83a598',
    active: '#b8bb26',
    idle: '#d5c4a1',
    warning: '#fabd2f',
    error: '#fb4934',
    violet: '#d3869b',
    selection: '#3c3836',
    selectionEdge: '#665c54',
    search: '#1d2021',
  },
  kanagawa: {
    backdrop: '#16161d',
    modalBackdrop: '#00000096',
    panel: '#1f1f28',
    panelSoft: '#2a2a37',
    border: '#7e9cd8',
    borderSoft: '#54546d',
    text: '#dcd7ba',
    activeText: '#fffdf0',
    muted: '#727169',
    accent: '#7e9cd8',
    active: '#98bb6c',
    idle: '#c8c093',
    warning: '#ffa066',
    error: '#e82424',
    violet: '#957fb8',
    selection: '#2d4f67',
    selectionEdge: '#54546d',
    search: '#16161d',
  },
  nord: {
    backdrop: '#242933',
    modalBackdrop: '#00000096',
    panel: '#2e3440',
    panelSoft: '#3b4252',
    border: '#88c0d0',
    borderSoft: '#4c566a',
    text: '#d8dee9',
    activeText: '#eceff4',
    muted: '#8994a8',
    accent: '#88c0d0',
    active: '#a3be8c',
    idle: '#e5e9f0',
    warning: '#ebcb8b',
    error: '#bf616a',
    violet: '#b48ead',
    selection: '#434c5e',
    selectionEdge: '#5e81ac',
    search: '#242933',
  },
  'atom-one-dark': {
    backdrop: '#1b1f27',
    modalBackdrop: '#00000096',
    panel: '#21252b',
    panelSoft: '#282c34',
    border: '#61afef',
    borderSoft: '#3e4451',
    text: '#abb2bf',
    activeText: '#f4f6fb',
    muted: '#7f848e',
    accent: '#61afef',
    active: '#98c379',
    idle: '#abb2bf',
    warning: '#e5c07b',
    error: '#e06c75',
    violet: '#c678dd',
    selection: '#2c323c',
    selectionEdge: '#4b5263',
    search: '#1b1f27',
  },
} as const satisfies Record<Exclude<ThemeId, 'system'>, ThemeTokens>

const systemDarkTheme = {
  backdrop: '#0f0f10',
  modalBackdrop: '#00000096',
  panel: '#171717',
  panelSoft: '#222222',
  border: '#6b7280',
  borderSoft: '#3f3f46',
  text: '#e5e7eb',
  activeText: '#ffffff',
  muted: '#a1a1aa',
  accent: '#60a5fa',
  active: '#86efac',
  idle: '#d4d4d8',
  warning: '#fbbf24',
  error: '#f87171',
  violet: '#c084fc',
  selection: '#263244',
  selectionEdge: '#52525b',
  search: '#111111',
} as const satisfies ThemeTokens

const systemLightTheme = {
  backdrop: '#f7f7f7',
  modalBackdrop: '#ffffff96',
  panel: '#ffffff',
  panelSoft: '#eeeeee',
  border: '#2563eb',
  borderSoft: '#d4d4d8',
  text: '#18181b',
  activeText: '#09090b',
  muted: '#71717a',
  accent: '#2563eb',
  active: '#15803d',
  idle: '#52525b',
  warning: '#b45309',
  error: '#dc2626',
  violet: '#7c3aed',
  selection: '#dbeafe',
  selectionEdge: '#bfdbfe',
  search: '#fafafa',
} as const satisfies ThemeTokens

export const theme: ThemeTokens = { ...systemDarkTheme }

export async function resolveTheme(
  themeId: ThemeId,
  reader: ThemeModeReader,
): Promise<ThemeTokens> {
  if (themeId !== 'system') {
    return themeCatalog[themeId]
  }

  const mode = await reader.waitForThemeMode(300).catch(() => null)

  return mode === 'light' ? systemLightTheme : systemDarkTheme
}

export function setActiveTheme(nextTheme: ThemeTokens) {
  Object.assign(theme, nextTheme)
}
