import type { HarbourRow, VisibilityFilter } from '@harbour/domain'

export type HarbourPopoverProps = {
  breadcrumb: string
  footer: string
  isLoading?: boolean
  notice?: string | null
  query: string
  rows: readonly HarbourRow[]
  sectionLabel: string
  selectedIndex: number
  visibility: VisibilityFilter
}

export function HarbourPopover({
  breadcrumb,
  footer,
  isLoading = false,
  notice,
  query,
  rows,
  sectionLabel,
  selectedIndex,
  visibility,
}: HarbourPopoverProps) {
  return (
    <box
      border
      borderStyle="single"
      borderColor="gray"
      flexDirection="column"
      height="100%"
      padding={1}
      width="100%"
    >
      <text>{formatHeader(breadcrumb, sectionLabel, visibility)}</text>
      <text>{`> ${query}`}</text>
      <box flexDirection="column" flexGrow={1} marginTop={1}>
        {isLoading ? <text>Loading projects...</text> : null}
        {!isLoading && rows.length === 0 ? <text>No matches</text> : null}
        {!isLoading
          ? rows.map((row, index) => (
              <box
                key={row.id}
                height={1}
                paddingLeft={1}
                style={index === selectedIndex ? { backgroundColor: 'white' } : {}}
                width="100%"
              >
                <text style={index === selectedIndex ? { fg: 'black' } : {}}>
                  {formatRow(row)}
                </text>
              </box>
            ))
          : null}
      </box>
      {notice ? <text>{notice}</text> : null}
      <text>{footer}</text>
    </box>
  )
}

function formatHeader(
  breadcrumb: string,
  sectionLabel: string,
  visibility: VisibilityFilter,
) {
  return `${breadcrumb}    ${sectionLabel} · ${capitalize(visibility)}`
}

function formatRow(row: HarbourRow) {
  const status = row.isActive ? '●' : '○'
  const label = truncate(row.label, 24).padEnd(24, ' ')
  const kind = row.kind.padEnd(10, ' ')
  return `${status} ${label} ${kind} ${row.metadata ?? ''}`.trimEnd()
}

function capitalize(value: string) {
  return value[0]?.toUpperCase() + value.slice(1)
}

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`
}
