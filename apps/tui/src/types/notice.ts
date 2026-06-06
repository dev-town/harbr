export type NoticeLevel = 'info' | 'success' | 'warning' | 'error'

export function noticeIcon(level: NoticeLevel) {
  if (level === 'error') {
    return ''
  }

  if (level === 'warning') {
    return ''
  }

  if (level === 'success') {
    return ''
  }

  return ''
}
