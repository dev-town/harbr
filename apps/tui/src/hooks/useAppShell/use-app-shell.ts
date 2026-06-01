import { useAtomValue, useSetAtom, useStore } from 'jotai'
import { useEffect } from 'react'

import { loadProjects } from '../../actions/refresh'
import {
  actionRowsAtom,
  noticeAtom,
  selectedActionRowIdAtom,
  selectedBrowseRowIdAtom,
  visibleBrowseRowsAtom,
} from '../../state'
import { useTuiServices } from '../useTuiServices'

export function useAppShell() {
  const services = useTuiServices()
  const store = useStore()
  const actionRows = useAtomValue(actionRowsAtom)
  const browseRows = useAtomValue(visibleBrowseRowsAtom)
  const notice = useAtomValue(noticeAtom)
  const selectedActionRowId = useAtomValue(selectedActionRowIdAtom)
  const selectedBrowseRowId = useAtomValue(selectedBrowseRowIdAtom)
  const setSelectedActionRowId = useSetAtom(selectedActionRowIdAtom)
  const setSelectedBrowseRowId = useSetAtom(selectedBrowseRowIdAtom)

  useEffect(() => {
    void loadProjects(services, store)
  }, [services, store])

  useEffect(() => {
    if (selectedBrowseRowId && browseRows.some((row) => row.id === selectedBrowseRowId)) {
      return
    }

    setSelectedBrowseRowId(browseRows[0]?.id ?? null)
  }, [browseRows, selectedBrowseRowId, setSelectedBrowseRowId])

  useEffect(() => {
    if (selectedActionRowId && actionRows.some((row) => row.id === selectedActionRowId)) {
      return
    }

    setSelectedActionRowId(actionRows[0]?.id ?? null)
  }, [actionRows, selectedActionRowId, setSelectedActionRowId])

  return { notice }
}
