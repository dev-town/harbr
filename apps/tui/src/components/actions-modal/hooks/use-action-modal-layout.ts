import { useTerminalDimensions } from '@opentui/react'

export function useActionModalLayout() {
  const { width } = useTerminalDimensions()
  const isNarrow = width < 90

  return {
    modalWidth: getModalWidth(width, 48),
    padding: isNarrow ? 0 : 1,
  }
}

function getModalWidth(width: number, maxWidth: number) {
  return Math.max(32, Math.min(maxWidth, width - (width < 90 ? 4 : 10)))
}
