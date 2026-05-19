import type { HarbourRow, VisibilityFilter } from '@harbour/domain'
import { useEffect, useRef } from 'react'

export type HarbourPopoverProps = {
  breadcrumb: string
  focusSearchNonce: number
  hoveredIndex: number | null
  isLoading?: boolean
  notice?: string | null
  onQueryChange: (value: string) => void
  onQuerySubmit: () => void
  onRowClick: (index: number) => void
  onRowHover: (index: number | null) => void
  placeholder: string
  query: string
  rows: readonly HarbourRow[]
  sectionLabel: string
  selectedIndex: number
  visibility: VisibilityFilter
}

const palette = {
  backdrop: '#11111b',
  panel: '#181825',
  panelSoft: '#1e1e2e',
  border: '#89b4fa',
  borderSoft: '#313244',
  text: '#cdd6f4',
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
} as const

export function HarbourPopover({
  breadcrumb,
  focusSearchNonce,
  hoveredIndex,
  isLoading = false,
  notice,
  onQueryChange,
  onQuerySubmit,
  onRowClick,
  onRowHover,
  placeholder,
  query,
  rows,
  sectionLabel,
  selectedIndex,
  visibility,
}: HarbourPopoverProps) {
  const scrollboxRef = useRef<{ scrollChildIntoView?: (childId: string) => void } | null>(null)
  const inputRef = useRef<{ focus?: () => void } | null>(null)

  const focusSearch = () => {
    inputRef.current?.focus?.()
  }

  useEffect(() => {
    const row = rows[selectedIndex]

    if (!row) {
      return
    }

    scrollboxRef.current?.scrollChildIntoView?.(`row:${row.id}`)
  }, [rows, selectedIndex])

  useEffect(() => {
    focusSearch()
  }, [focusSearchNonce, selectedIndex, visibility, rows.length])

  return (
    <box
      border
      borderColor={palette.border}
      borderStyle="single"
      flexDirection="column"
      height="100%"
      padding={1}
      style={{ backgroundColor: palette.panel }}
      width="100%"
    >
      <SearchBar
        inputRef={inputRef}
        onQueryChange={onQueryChange}
        onQuerySubmit={onQuerySubmit}
        placeholder={placeholder}
        query={query}
      />
      <box flexDirection="column" flexGrow={1} marginTop={1} width="100%">
        <ListHeader />
        <scrollbox
          ref={scrollboxRef}
          style={{
            contentOptions: {
              backgroundColor: palette.panel,
            },
            rootOptions: {
              backgroundColor: palette.panel,
            },
            scrollbarOptions: {
              trackOptions: {
                backgroundColor: palette.panelSoft,
                foregroundColor: palette.selectionEdge,
              },
            },
            viewportOptions: {
              backgroundColor: palette.panel,
            },
            wrapperOptions: {
              backgroundColor: palette.panel,
            },
          }}
        >
          {isLoading ? <StatusLine color={palette.accent} icon="" text="Refreshing Harbour view..." /> : null}
          {!isLoading && rows.length === 0 ? (
            <StatusLine
              color={palette.muted}
              icon="󰮗"
              text={`No ${sectionLabel.toLowerCase()} match current filters`}
            />
          ) : null}
          {!isLoading
            ? rows.map((row, index) => (
                <box id={`row:${row.id}`} key={row.id} width="100%">
                  <RowLine
                    hoveredIndex={hoveredIndex}
                    index={index}
                    isSelected={index === selectedIndex}
                    onRowClick={onRowClick}
                    onRowHover={onRowHover}
                    row={row}
                  />
                </box>
              ))
            : null}
        </scrollbox>
      </box>
      {notice ? <NoticeLine notice={notice} /> : null}
      <FooterRow breadcrumb={breadcrumb} visibility={visibility} />
    </box>
  )
}

function SearchBar({
  inputRef,
  onQueryChange,
  onQuerySubmit,
  placeholder,
  query,
}: {
  inputRef: { current: { focus?: () => void } | null }
  onQueryChange: (value: string) => void
  onQuerySubmit: () => void
  placeholder: string
  query: string
}) {
  return (
    <box
      border
      borderColor={palette.borderSoft}
      borderStyle="single"
      height={3}
      paddingLeft={1}
      paddingRight={1}
      style={{ backgroundColor: palette.search }}
      width="100%"
    >
      <box style={{ justifyContent: 'center' }} width="100%">
        <input
          focused
          ref={inputRef}
          onInput={onQueryChange}
          onSubmit={onQuerySubmit}
          placeholder={placeholder}
          value={query}
        />
      </box>
    </box>
  )
}

function ListHeader() {
  return (
    <box marginBottom={1} paddingLeft={1} paddingRight={1} width="100%">
      <text>
        <span fg={palette.muted}>{padCell('', 2)}</span>
        <span fg={palette.muted}>{padCell('Name', 44)}</span>
        <span fg={palette.muted}>{padCell('', 2)}</span>
        <span fg={palette.muted}>{padCell('Type', 12)}</span>
        <span fg={palette.muted}>State</span>
      </text>
    </box>
  )
}

function RowLine({
  hoveredIndex,
  index,
  isSelected,
  onRowClick,
  onRowHover,
  row,
}: {
  hoveredIndex: number | null
  index: number
  isSelected: boolean
  onRowClick: (index: number) => void
  onRowHover: (index: number | null) => void
  row: HarbourRow
}) {
  const status = getStatusChip(row)
  const kind = getKindChip(row)
  const label = truncate(row.label, 44)
  const isHovered = hoveredIndex === index
  const backgroundColor = isSelected
    ? palette.selection
    : isHovered
      ? palette.panelSoft
      : palette.panel

  return (
    <box
      onMouseDown={() => onRowClick(index)}
      onMouseOut={() => onRowHover(null)}
      onMouseOver={() => onRowHover(index)}
      paddingLeft={1}
      paddingRight={1}
      style={{ backgroundColor }}
      width="100%"
    >
      <text>
        <span fg={status.color}>{status.icon}</span>
        <span fg={palette.text}> </span>
        <span fg={isSelected ? '#f5f7ff' : palette.text}>{padCell(label, 44)}</span>
        <span fg={palette.muted}>{padCell('', 2)}</span>
        <strong fg={kind.color}>{padChip(kind.label, 12)}</strong>
        <span fg={palette.muted}> </span>
        <strong fg={status.color}>{padChip(status.label, 14)}</strong>
      </text>
    </box>
  )
}

function NoticeLine({ notice }: { notice: string }) {
  return (
    <box marginTop={1} width="100%">
      <text>
        <span fg={palette.error}> </span>
        <span fg={palette.error}>{notice}</span>
      </text>
    </box>
  )
}

function StatusLine({
  color,
  icon,
  text,
}: {
  color: string
  icon: string
  text: string
}) {
  return (
    <box paddingLeft={1} width="100%">
      <text>
        <span fg={color}>{icon} </span>
        <span fg={color}>{text}</span>
      </text>
    </box>
  )
}

function FooterRow({
  breadcrumb,
  visibility,
}: {
  breadcrumb: string
  visibility: VisibilityFilter
}) {
  return (
    <box marginTop={2} paddingLeft={1} paddingRight={1} style={{ backgroundColor: palette.panelSoft }} width="100%">
      <text>
        <span bg={visibilityColor(visibility)} fg={palette.backdrop}> {visibility.toUpperCase()} </span>
        <span fg={palette.muted}>  {breadcrumbLabel(breadcrumb)}</span>
      </text>
    </box>
  )
}

function breadcrumbLabel(value: string) {
  return value.split(' › ').join(' > ')
}

function getKindChip(row: HarbourRow) {
  if (row.kind === 'project') {
    return { color: palette.accent, label: 'project' }
  }

  if (row.kind === 'workspace') {
    return { color: palette.warning, label: row.isDefault ? 'default' : 'workspace' }
  }

  if (row.kind === 'module') {
    return { color: palette.violet, label: 'module' }
  }

  return { color: palette.muted, label: row.kind }
}

function getStatusChip(row: HarbourRow) {
  if (row.kind === 'project' || row.kind === 'workspace') {
    if (row.activeSessionCount > 0) {
      const count = row.activeSessionCount === 1 ? '1 session' : `${row.activeSessionCount} sessions`
      return { color: palette.active, icon: '●', label: count }
    }

    return { color: palette.idle, icon: '○', label: 'idle' }
  }

  if (row.kind === 'module') {
    return row.hasSession
      ? { color: palette.active, icon: '󰆍', label: 'live' }
      : { color: palette.idle, icon: '󰈈', label: 'idle' }
  }

  return { color: palette.muted, icon: '•', label: row.metadata ?? 'state' }
}

function visibilityColor(visibility: VisibilityFilter) {
  return visibility === 'active' ? palette.active : palette.warning
}

function padCell(value: string, width: number) {
  return truncate(value, width).padEnd(width, ' ')
}

function padChip(value: string, width: number) {
  return truncate(value, width).padEnd(width, ' ')
}

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`
}
