import type { NoticeLevel } from '../../types/notice'

export type RowVariant = 'stacked' | 'default'

export type ListRowMetaNotice = {
  level: NoticeLevel
  message: string
}

export type ListRowMeta = {
  active?: boolean
  breadcrumb?: string
  branch?: string | null
  notice?: ListRowMetaNotice
  sessions?: number
}
