import { theme } from '../../config/theme'
import { noticeIcon, type NoticeLevel } from '../../types/notice'
import {
  selectBreadcrumb,
  selectEffectiveVisibility,
  useTuiStore,
} from '../../store'
import { breadcrumbLabel } from './utils/breadcrumb-label'
import { visibilityColor } from './utils/visibility-color'

export function FooterRow() {
  const breadcrumb = useTuiStore(selectBreadcrumb)
  const currentRoute = useTuiStore((state) => state.app.currentRoute)
  const interactionMode = useTuiStore((state) => state.surfaces.interactionMode)
  const notice = useTuiStore((state) => state.app.notice)
  const visibility = useTuiStore(selectEffectiveVisibility)
  const showVisibility = currentRoute === 'browse'

  return (
    <box
      flexDirection="row"
      paddingLeft={1}
      paddingRight={1}
      style={{ justifyContent: 'space-between' }}
      width="100%"
    >
      <text>
        {showVisibility ? (
          <span bg={visibilityColor(visibility)} fg={theme.backdrop}>
            {' '}
            {visibility.toUpperCase()}{' '}
          </span>
        ) : null}
        {notice ? (
          <span fg={noticeColor(notice.level)}>
            {' '}
            {noticeIcon(notice.level)} {noticeLabel(notice.level)}{' '}
            {notice.message}
          </span>
        ) : (
          <span fg={theme.muted}> {breadcrumbLabel(breadcrumb)}</span>
        )}
      </text>
      <text>
        <span fg={theme.active}>
          {interactionMode === 'input' ? 'Esc' : 'i'}
        </span>
        <span fg={theme.muted}>
          {interactionMode === 'input' ? ' Normal' : ' Search'}
        </span>
        <span fg={theme.muted}> </span>
        <span fg={theme.active}>?</span>
        <span fg={theme.muted}> Help</span>
      </text>
    </box>
  )
}

function noticeColor(level: NoticeLevel) {
  if (level === 'error') {
    return theme.error
  }

  if (level === 'warning') {
    return theme.warning
  }

  if (level === 'success') {
    return theme.active
  }

  return theme.accent
}

function noticeLabel(level: NoticeLevel) {
  return level.toUpperCase()
}
