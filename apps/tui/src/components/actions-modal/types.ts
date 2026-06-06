import type { BoxRenderable } from '@opentui/core'

export type ActionItemBase = {
  disabledNotice?: string
  id: string
  label: string
}

export type ActionModalFocusRef = {
  current: BoxRenderable | null
}

export type ActionsModalProps<T extends ActionItemBase> = {
  focusRef?: ActionModalFocusRef
  initialSelectedId?: string | null
  isOpen: boolean
  items: readonly T[]
  onClose: () => void
  onSelect: (item: T) => void
  title?: string
}
