import type { Binding } from '@opentui/keymap'
import type { InteractionMode } from '../store'

export type HelpBinding = Binding & {
  desc: string
  group: string
}

const noop = () => {}

export function makeRootBindings(input: {
  onHelp: () => void
  onQuit: () => void
}): readonly HelpBinding[] {
  return [
    { key: '?', cmd: input.onHelp, group: 'Global', desc: 'Show help' },
    { key: 'ctrl+c', cmd: input.onQuit, group: 'Global', desc: 'Quit' },
  ]
}

export function makeActiveBindings(input: {
  interactionMode: InteractionMode
  onActions: () => void
  onBack: () => void
  onEnterInputMode: () => void
  onExitInputMode: () => void
  onMoveDown: () => void
  onMoveUp: () => void
  onNextRoute: () => void
  onPageDown: () => void
  onPageUp: () => void
  onPreviousRoute: () => void
  onRefresh: () => void
  onSelect: () => void
}): readonly HelpBinding[] {
  if (input.interactionMode === 'input') {
    return [
      {
        key: 'escape',
        cmd: input.onExitInputMode,
        group: 'Search',
        desc: 'Leave search',
      },
      { key: 'up', cmd: input.onMoveUp, group: 'Active', desc: 'Move up' },
      {
        key: 'down',
        cmd: input.onMoveDown,
        group: 'Active',
        desc: 'Move down',
      },
      {
        key: 'return',
        cmd: input.onSelect,
        group: 'Active',
        desc: 'Switch session',
      },
      { key: 'tab', cmd: input.onNextRoute, group: 'Global', desc: 'Next tab' },
      {
        key: 'shift+tab',
        cmd: input.onPreviousRoute,
        group: 'Global',
        desc: 'Previous tab',
      },
      { key: 'ctrl+r', cmd: input.onRefresh, group: 'Global', desc: 'Refresh' },
      {
        key: 'ctrl+a',
        cmd: input.onActions,
        group: 'Active',
        desc: 'Open actions',
      },
    ]
  }

  return [
    {
      key: 'i',
      cmd: input.onEnterInputMode,
      group: 'Search',
      desc: 'Focus search',
    },
    {
      key: '/',
      cmd: input.onEnterInputMode,
      group: 'Search',
      desc: 'Focus search',
    },
    { key: 'up', cmd: input.onMoveUp, group: 'Active', desc: 'Move up' },
    { key: 'k', cmd: input.onMoveUp, group: 'Active', desc: 'Move up' },
    { key: 'down', cmd: input.onMoveDown, group: 'Active', desc: 'Move down' },
    { key: 'j', cmd: input.onMoveDown, group: 'Active', desc: 'Move down' },
    { key: 'pageup', cmd: input.onPageUp, group: 'Active', desc: 'Page up' },
    { key: 'ctrl+u', cmd: input.onPageUp, group: 'Active', desc: 'Page up' },
    {
      key: 'pagedown',
      cmd: input.onPageDown,
      group: 'Active',
      desc: 'Page down',
    },
    {
      key: 'ctrl+d',
      cmd: input.onPageDown,
      group: 'Active',
      desc: 'Page down',
    },
    {
      key: 'return',
      cmd: input.onSelect,
      group: 'Active',
      desc: 'Switch session',
    },
    { key: 'escape', cmd: input.onBack, group: 'Active', desc: 'Back' },
    { key: 'tab', cmd: input.onNextRoute, group: 'Global', desc: 'Next tab' },
    {
      key: 'shift+tab',
      cmd: input.onPreviousRoute,
      group: 'Global',
      desc: 'Previous tab',
    },
    { key: 'ctrl+r', cmd: input.onRefresh, group: 'Global', desc: 'Refresh' },
    {
      key: 'ctrl+a',
      cmd: input.onActions,
      group: 'Active',
      desc: 'Open actions',
    },
  ]
}

export function makeBrowseBindings(input: {
  interactionMode: InteractionMode
  onActions: () => void
  onBack: () => void
  onEnterInputMode: () => void
  onExitInputMode: () => void
  onMoveDown: () => void
  onMoveUp: () => void
  onNextRoute: () => void
  onPageDown: () => void
  onPageUp: () => void
  onPreviousRoute: () => void
  onRefresh: () => void
  onSelect: () => void
  onToggleVisibility: () => void
}): readonly HelpBinding[] {
  if (input.interactionMode === 'input') {
    return [
      {
        key: 'escape',
        cmd: input.onExitInputMode,
        group: 'Search',
        desc: 'Leave search',
      },
      { key: 'up', cmd: input.onMoveUp, group: 'Browse', desc: 'Move up' },
      {
        key: 'down',
        cmd: input.onMoveDown,
        group: 'Browse',
        desc: 'Move down',
      },
      { key: 'return', cmd: input.onSelect, group: 'Browse', desc: 'Select' },
      { key: 'tab', cmd: input.onNextRoute, group: 'Global', desc: 'Next tab' },
      {
        key: 'shift+tab',
        cmd: input.onPreviousRoute,
        group: 'Global',
        desc: 'Previous tab',
      },
      { key: 'ctrl+r', cmd: input.onRefresh, group: 'Global', desc: 'Refresh' },
      {
        key: 'ctrl+f',
        cmd: input.onToggleVisibility,
        group: 'Browse',
        desc: 'Toggle active/all',
      },
      {
        key: 'ctrl+a',
        cmd: input.onActions,
        group: 'Browse',
        desc: 'Open actions',
      },
    ]
  }

  return [
    {
      key: 'i',
      cmd: input.onEnterInputMode,
      group: 'Search',
      desc: 'Focus search',
    },
    {
      key: '/',
      cmd: input.onEnterInputMode,
      group: 'Search',
      desc: 'Focus search',
    },
    { key: 'up', cmd: input.onMoveUp, group: 'Browse', desc: 'Move up' },
    { key: 'k', cmd: input.onMoveUp, group: 'Browse', desc: 'Move up' },
    { key: 'down', cmd: input.onMoveDown, group: 'Browse', desc: 'Move down' },
    { key: 'j', cmd: input.onMoveDown, group: 'Browse', desc: 'Move down' },
    { key: 'pageup', cmd: input.onPageUp, group: 'Browse', desc: 'Page up' },
    { key: 'ctrl+u', cmd: input.onPageUp, group: 'Browse', desc: 'Page up' },
    {
      key: 'pagedown',
      cmd: input.onPageDown,
      group: 'Browse',
      desc: 'Page down',
    },
    {
      key: 'ctrl+d',
      cmd: input.onPageDown,
      group: 'Browse',
      desc: 'Page down',
    },
    { key: 'return', cmd: input.onSelect, group: 'Browse', desc: 'Select' },
    { key: 'escape', cmd: input.onBack, group: 'Browse', desc: 'Back' },
    { key: 'tab', cmd: input.onNextRoute, group: 'Global', desc: 'Next tab' },
    {
      key: 'shift+tab',
      cmd: input.onPreviousRoute,
      group: 'Global',
      desc: 'Previous tab',
    },
    { key: 'ctrl+r', cmd: input.onRefresh, group: 'Global', desc: 'Refresh' },
    {
      key: 'ctrl+f',
      cmd: input.onToggleVisibility,
      group: 'Browse',
      desc: 'Toggle active/all',
    },
    {
      key: 'ctrl+a',
      cmd: input.onActions,
      group: 'Browse',
      desc: 'Open actions',
    },
  ]
}

export function makeActionsModalBindings(input: {
  onClose: () => void
  onMoveDown: () => void
  onMoveUp: () => void
  onSelect: () => void
}): readonly HelpBinding[] {
  return [
    { key: 'up', cmd: input.onMoveUp, group: 'Action modal', desc: 'Move up' },
    {
      key: 'down',
      cmd: input.onMoveDown,
      group: 'Action modal',
      desc: 'Move down',
    },
    {
      key: 'return',
      cmd: input.onSelect,
      group: 'Action modal',
      desc: 'Select',
    },
    { key: 'escape', cmd: input.onClose, group: 'Action modal', desc: 'Close' },
  ]
}

export function makeCreateWorkspaceBindings(input: {
  onBack: () => void
  onSubmit: () => void
}): readonly HelpBinding[] {
  return [
    {
      key: 'escape',
      cmd: input.onBack,
      group: 'Create workspace',
      desc: 'Back',
    },
    {
      key: 'return',
      cmd: input.onSubmit,
      group: 'Create workspace',
      desc: 'Submit',
    },
  ]
}

export function makeWindowPickerBindings(input: {
  onClose: () => void
  onConfirm: () => void
  onMoveDown: () => void
  onMoveUp: () => void
  onToggle: () => void
}): readonly HelpBinding[] {
  return [
    { key: 'up', cmd: input.onMoveUp, group: 'Window picker', desc: 'Move up' },
    {
      key: 'down',
      cmd: input.onMoveDown,
      group: 'Window picker',
      desc: 'Move down',
    },
    {
      key: 'space',
      cmd: input.onToggle,
      group: 'Window picker',
      desc: 'Toggle window',
    },
    {
      key: 'return',
      cmd: input.onConfirm,
      group: 'Window picker',
      desc: 'Confirm',
    },
    {
      key: 'escape',
      cmd: input.onClose,
      group: 'Window picker',
      desc: 'Close',
    },
  ]
}

export function makeHelpBindings(input: {
  onClose: () => void
  onPageDown: () => void
  onPageUp: () => void
  onScrollDown: () => void
  onScrollUp: () => void
}): readonly HelpBinding[] {
  return [
    { key: 'escape', cmd: input.onClose, group: 'Help', desc: 'Close help' },
    { key: '?', cmd: input.onClose, group: 'Help', desc: 'Close help' },
    {
      key: 'down',
      cmd: input.onScrollDown,
      group: 'Help',
      desc: 'Scroll down',
    },
    { key: 'j', cmd: input.onScrollDown, group: 'Help', desc: 'Scroll down' },
    { key: 'up', cmd: input.onScrollUp, group: 'Help', desc: 'Scroll up' },
    { key: 'k', cmd: input.onScrollUp, group: 'Help', desc: 'Scroll up' },
    { key: 'ctrl+d', cmd: input.onPageDown, group: 'Help', desc: 'Page down' },
    { key: 'ctrl+u', cmd: input.onPageUp, group: 'Help', desc: 'Page up' },
  ]
}

export function getHelpBindingGroups(): readonly (readonly HelpBinding[])[] {
  return [
    makeRootBindings({ onHelp: noop, onQuit: noop }),
    makeActiveBindings({
      interactionMode: 'normal',
      onActions: noop,
      onBack: noop,
      onEnterInputMode: noop,
      onExitInputMode: noop,
      onMoveDown: noop,
      onMoveUp: noop,
      onNextRoute: noop,
      onPageDown: noop,
      onPageUp: noop,
      onPreviousRoute: noop,
      onRefresh: noop,
      onSelect: noop,
    }),
    makeBrowseBindings({
      interactionMode: 'normal',
      onActions: noop,
      onBack: noop,
      onEnterInputMode: noop,
      onExitInputMode: noop,
      onMoveDown: noop,
      onMoveUp: noop,
      onNextRoute: noop,
      onPageDown: noop,
      onPageUp: noop,
      onPreviousRoute: noop,
      onRefresh: noop,
      onSelect: noop,
      onToggleVisibility: noop,
    }),
    makeActiveBindings({
      interactionMode: 'input',
      onActions: noop,
      onBack: noop,
      onEnterInputMode: noop,
      onExitInputMode: noop,
      onMoveDown: noop,
      onMoveUp: noop,
      onNextRoute: noop,
      onPageDown: noop,
      onPageUp: noop,
      onPreviousRoute: noop,
      onRefresh: noop,
      onSelect: noop,
    }),
    makeActionsModalBindings({
      onClose: noop,
      onMoveDown: noop,
      onMoveUp: noop,
      onSelect: noop,
    }),
    makeWindowPickerBindings({
      onClose: noop,
      onConfirm: noop,
      onMoveDown: noop,
      onMoveUp: noop,
      onToggle: noop,
    }),
    makeCreateWorkspaceBindings({ onBack: noop, onSubmit: noop }),
    makeHelpBindings({
      onClose: noop,
      onPageDown: noop,
      onPageUp: noop,
      onScrollDown: noop,
      onScrollUp: noop,
    }),
  ]
}
