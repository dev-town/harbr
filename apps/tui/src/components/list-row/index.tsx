import { theme } from '~/config/theme'
import { noticeIcon } from '~/types/notice'
import { padCell, truncate, truncateLeft } from '~/components/shared/utils/text'

import type { ListRowMeta, ListRowMetaNotice, RowVariant } from './types'
import { getInlineMeta, getStackedMeta } from './utils'

type ListRowProps = {
  isHovered: boolean
  isSelected: boolean
  marker: string
  markerColor: string
  meta?: ListRowMeta
  name: string
  onRowClick: () => void
  onRowHover: (rowId: string | null) => void
  rowId: string
  variant: RowVariant
}

export function ListRow({
  isHovered,
  isSelected,
  marker,
  markerColor,
  meta,
  name,
  onRowClick,
  onRowHover,
  rowId,
  variant,
}: ListRowProps) {
  const selectedColor = isSelected
    ? theme.selection
    : isHovered
      ? theme.panelSoft
      : theme.panel
  const nameWidth = 34
  const metaWidth = 52
  const gutterWidth = 4
  const notice = meta?.notice
  const noticeText = notice
    ? `${noticeIcon(notice.level)} ${notice.message}`
    : ''
  const inlineMeta =
    meta && !notice && variant !== 'stacked' ? getInlineMeta(meta, variant) : ''
  const stackedMeta = meta && !notice ? getStackedMeta(meta) : ''
  const topTextColor = isSelected ? theme.activeText : theme.text
  const stackedRowHeight = stackedMeta || notice ? 2 : 1

  return (
    <box
      border
      borderColor={selectedColor}
      borderStyle="rounded"
      onMouseDown={onRowClick}
      onMouseOut={() => onRowHover(null)}
      onMouseOver={() => onRowHover(rowId)}
      paddingLeft={1}
      paddingRight={1}
      width="100%"
    >
      {variant === 'stacked' ? (
        <box flexDirection="row" width="100%">
          <box
            height={stackedRowHeight}
            style={{ justifyContent: 'center' }}
            width={2}
          >
            <text>
              <span fg={markerColor}>{marker}</span>
            </text>
          </box>
          <box flexDirection="column" flexGrow={1} width="100%">
            <text fg={topTextColor}>
              <strong>{name}</strong>
            </text>
            {notice ? (
              <text>
                <span fg={noticeColor(notice.level)}>
                  {truncate(noticeText, 72)}
                </span>
              </text>
            ) : stackedMeta ? (
              <text>
                <span fg={theme.muted}>{truncate(stackedMeta, 72)}</span>
              </text>
            ) : null}
          </box>
        </box>
      ) : (
        <box flexDirection="row" style={{ alignItems: 'center' }} width="100%">
          <box width={2}>
            <text>
              <span fg={markerColor}>{marker}</span>
            </text>
          </box>
          <box width={nameWidth}>
            <text fg={topTextColor}>
              <strong>{padCell(truncate(name, nameWidth), nameWidth)}</strong>
            </text>
          </box>
          <box width={gutterWidth} />
          {notice ? (
            <box flexGrow={1} style={{ justifyContent: 'flex-end' }}>
              <text>
                <span fg={noticeColor(notice.level)}>
                  {truncateLeft(noticeText, metaWidth)}
                </span>
              </text>
            </box>
          ) : inlineMeta ? (
            <box flexGrow={1} style={{ justifyContent: 'flex-end' }}>
              <text>
                <span fg={theme.muted}>
                  {truncateLeft(inlineMeta, metaWidth)}
                </span>
              </text>
            </box>
          ) : (
            <box flexGrow={1} />
          )}
        </box>
      )}
    </box>
  )
}

function noticeColor(level: ListRowMetaNotice['level']) {
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
