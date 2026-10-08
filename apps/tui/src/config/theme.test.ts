import { describe, expect, it } from 'vitest'

import {
  resolveTheme,
  setActiveTheme,
  theme,
  themeCatalog,
  themeIds,
  type ThemeId,
  type ThemeModeReader,
  type ThemeTokens,
} from './theme'

const tokenKeys = [
  'backdrop',
  'modalBackdrop',
  'panel',
  'panelSoft',
  'border',
  'borderSoft',
  'text',
  'activeText',
  'muted',
  'accent',
  'active',
  'idle',
  'warning',
  'error',
  'violet',
  'selection',
  'selectionEdge',
  'search',
] as const satisfies readonly (keyof ThemeTokens)[]

describe('theme config', () => {
  it('defines complete tokens for every static theme', () => {
    for (const themeId of themeIds.filter((id) => id !== 'system')) {
      const tokens = themeCatalog[themeId]

      expect(Object.keys(tokens).sort()).toEqual([...tokenKeys].sort())

      for (const key of tokenKeys) {
        expect(tokens[key]).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/i)
      }
    }
  })

  it('resolves static themes without querying terminal mode', async () => {
    const reader = makeThemeModeReader('light')

    await expect(resolveTheme('tokyonight', reader)).resolves.toBe(themeCatalog.tokyonight)
    expect(reader.waitCount).toBe(0)
  })

  it('resolves system theme from terminal mode', async () => {
    await expect(resolveTheme('system', makeThemeModeReader('light'))).resolves.toMatchObject({
      panel: '#ffffff',
      text: '#18181b',
    })

    await expect(resolveTheme('system', makeThemeModeReader('dark'))).resolves.toMatchObject({
      border: '#6b7280',
      panel: '#171717',
      text: '#e5e7eb',
    })
  })

  it('falls back to dark system theme when terminal mode is unavailable', async () => {
    await expect(resolveTheme('system', makeThemeModeReader(null))).resolves.toMatchObject({
      border: '#6b7280',
      panel: '#171717',
      text: '#e5e7eb',
    })
  })

  it('falls back to dark system theme when terminal mode detection fails', async () => {
    await expect(
      resolveTheme('system', {
        waitForThemeMode: () => Promise.reject(new Error('unsupported')),
      }),
    ).resolves.toMatchObject({
      border: '#6b7280',
      panel: '#171717',
      text: '#e5e7eb',
    })
  })

  it('keeps catppuccin distinct from the dark system fallback', async () => {
    await expect(resolveTheme('system', makeThemeModeReader('dark'))).resolves.not.toMatchObject(
      themeCatalog.catppuccin,
    )
  })

  it('updates the active exported theme in place', () => {
    setActiveTheme(themeCatalog.nord)

    expect(theme).toMatchObject(themeCatalog.nord)
  })
})

function makeThemeModeReader(mode: 'dark' | 'light' | null): ThemeModeReader & {
  waitCount: number
} {
  return {
    waitCount: 0,
    async waitForThemeMode() {
      this.waitCount += 1
      return mode
    },
  }
}

const _assertThemeIds: readonly ThemeId[] = themeIds
void _assertThemeIds
