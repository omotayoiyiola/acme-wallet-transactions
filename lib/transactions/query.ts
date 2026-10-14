import type { TransactionQuery } from '@/lib/api/endpoints'
import { TRANSACTION_STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '@/lib/format'
import { CURRENCIES, type TransactionStatus, type TransactionType } from '@/types/api'

export function readTransactionQuery(params: URLSearchParams): TransactionQuery {
  const page = Number(params.get('page') ?? 1)
  const type = params.get('type') ?? ''
  const status = params.get('status') ?? ''
  const currency = CURRENCIES.find((value) => value === params.get('currency'))
  const date = (key: string) => {
    const value = params.get(key) ?? ''
    return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value
      ? value
      : undefined
  }
  return {
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    limit: 20,
    q: params.get('q')?.trim() || undefined,
    type: Object.hasOwn(TRANSACTION_TYPE_LABELS, type) ? (type as TransactionType) : undefined,
    status:
      status === 'reversed'
        ? status
        : Object.hasOwn(TRANSACTION_STATUS_LABELS, status)
          ? (status as TransactionStatus)
          : undefined,
    currency,
    from: date('from'),
    to: date('to'),
  }
}

export function pageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  const visible = Array.from(
    new Set([1, total, current - 1, current, current + 1, ...(current <= 2 ? [2, 3] : [])])
  )
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b)
  return visible.flatMap((page, index) =>
    index > 0 && page - visible[index - 1] > 1 ? ['ellipsis' as const, page] : [page]
  )
}
