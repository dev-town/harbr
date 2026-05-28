import { useAtomValue } from 'jotai'

import { theme } from '../../config/theme'
import { actionsOpenAtom, actionRowsAtom, type FocusTargetRef, noticeAtom, visibleBrowseRowsAtom } from '../../state'
import { ActionsModal } from '../actions-modal'
import { FooterRow } from '../footer-row'
import { ListHeader } from '../list-header'
import { NoticeLine } from '../notice-line'
import { ResultsList } from '../results-list'
import { SearchBar } from '../search-bar'

export function HarbourPopover({
  actionsFocusRef,
  browseSearchRef,
}: {
  actionsFocusRef?: FocusTargetRef
  browseSearchRef?: FocusTargetRef
}) {
  const actionsOpen = useAtomValue(actionsOpenAtom)
  const actionRows = useAtomValue(actionRowsAtom)
  const notice = useAtomValue(noticeAtom)
  const browseRows = useAtomValue(visibleBrowseRowsAtom)

  return (
    <box
      border
      borderColor={theme.border}
      borderStyle="single"
      flexDirection="column"
      height="100%"
      padding={1}
      style={{ backgroundColor: theme.panel }}
      width="100%"
    >
      <box flexDirection="column" flexGrow={1} style={{ backgroundColor: theme.panel }} width="100%">
        <SearchBar
          focused={!actionsOpen}
          {...(browseSearchRef ? { inputRef: browseSearchRef } : {})}
        />
        <box flexDirection="column" flexGrow={1} marginTop={1} width="100%">
          <ListHeader />
          <ResultsList rows={browseRows} />
        </box>
      </box>
      {actionsOpen ? (
        <ActionsModal rows={actionRows} {...(actionsFocusRef ? { focusRef: actionsFocusRef } : {})} />
      ) : null}
      {notice ? <NoticeLine notice={notice} /> : null}
      <FooterRow />
    </box>
  )
}
