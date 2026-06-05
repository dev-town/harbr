import { useAtomValue, useSetAtom, useStore } from 'jotai'
import { useEffect } from 'react'

import { loadProjects } from '../../actions/refresh'
import {
  actionRowsAtom,
  selectedActionRowIdAtom,
  selectedBrowseRowIdAtom,
  visibleBrowseRowsAtom,
} from '../../routes/browse'
import { selectedActiveRowIdAtom, visibleActiveRowsAtom } from '../../routes/active'
import {
  noticeAtom,
} from '../../state'
import { useTuiServices } from '../useTuiServices'

export function useAppShell() {
  const services = useTuiServices()
  const store = useStore()
  const actionRows = useAtomValue(actionRowsAtom)
  const activeRows = useAtomValue(visibleActiveRowsAtom)
  const browseRows = useAtomValue(visibleBrowseRowsAtom)
  const notice = useAtomValue(noticeAtom)
  const selectedActiveRowId = useAtomValue(selectedActiveRowIdAtom)
  const selectedActionRowId = useAtomValue(selectedActionRowIdAtom)
  const selectedBrowseRowId = useAtomValue(selectedBrowseRowIdAtom)
  const setSelectedActiveRowId = useSetAtom(selectedActiveRowIdAtom)
  const setSelectedActionRowId = useSetAtom(selectedActionRowIdAtom)
  const setSelectedBrowseRowId = useSetAtom(selectedBrowseRowIdAtom)

  useEffect(() => {
    void loadProjects(services, store)
  }, [services, store])

  useEffect(() => {
    if (selectedActiveRowId && activeRows.some((row) => row.id === selectedActiveRowId)) {
      return
    }

    setSelectedActiveRowId(activeRows[0]?.id ?? null)
  }, [activeRows, selectedActiveRowId, setSelectedActiveRowId])

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
