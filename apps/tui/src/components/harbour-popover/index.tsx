import { useAtomValue } from 'jotai'

import { theme } from '../../config/theme'
import { noticeAtom } from '../../state'
import { FooterRow } from '../footer-row'
import { ListHeader } from '../list-header'
import { NoticeLine } from '../notice-line'
import { ResultsList } from '../results-list'
import { SearchBar } from '../search-bar'

export function HarbourPopover() {
  const notice = useAtomValue(noticeAtom)

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
      <SearchBar />
      <box flexDirection="column" flexGrow={1} marginTop={1} width="100%">
        <ListHeader />
        <ResultsList />
      </box>
      {notice ? <NoticeLine notice={notice} /> : null}
      <FooterRow />
    </box>
  )
}
