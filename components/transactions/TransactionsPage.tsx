'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button, Drawer, Input, Select } from '@/components/ui'
import { getTransactions } from '@/lib/api/endpoints'
import { formatDate, TRANSACTION_STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '@/lib/format'
import { pageNumbers, readTransactionQuery } from '@/lib/transactions/query'
import { TransactionRow } from './TransactionRow'
import { TransactionDetails } from './TransactionDetails'
import { useRemote } from './useRemote'
import { EmptyState, LoadingRows } from './TransactionStates'
import styles from './TransactionsPage.module.css'

export function updateQuery(changes: Record<string, string | undefined>, replace = false) {
  const params = new URLSearchParams(window.location.search)
  for (const [key, value] of Object.entries(changes)) {
    if (value) params.set(key, value)
    else params.delete(key)
  }
  const url = `${window.location.pathname}${params.size ? `?${params}` : ''}`
  if (url !== window.location.pathname + window.location.search) {
    window.history[replace ? 'replaceState' : 'pushState'](null, '', url)
  }
}

function Search({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial)
  const [previousInitial, setPreviousInitial] = useState(initial)
  if (previousInitial !== initial) {
    setPreviousInitial(initial)
    setValue(initial)
  }
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    const restore = () => {
      clearTimeout(timeout.current)
      setValue(new URLSearchParams(window.location.search).get('q') ?? '')
    }
    window.addEventListener('popstate', restore)
    return () => {
      clearTimeout(timeout.current)
      window.removeEventListener('popstate', restore)
    }
  }, [])
  return (
    <Input
      label="Search"
      type="search"
      leadingIcon="search"
      placeholder="Search by reference, name or narration"
      value={value}
      fieldClassName={styles.search}
      onChange={(event) => {
        const next = event.target.value
        setValue(next)
        clearTimeout(timeout.current)
        timeout.current = setTimeout(() => updateQuery({ q: next.trim(), page: undefined }), 300)
      }}
    />
  )
}

function groupLabel(iso: string) {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return formatDate(iso)
}

export function TransactionsPage() {
  const searchParams = useSearchParams()
  const raw = searchParams.toString()
  const serialized = JSON.stringify(readTransactionQuery(new URLSearchParams(raw)))
  const query = useMemo(() => JSON.parse(serialized) as ReturnType<typeof readTransactionQuery>, [serialized])
  const scenario = searchParams.get('__scenario') ?? ''
  const fetcher = useCallback(
    (signal: AbortSignal) => getTransactions({ ...query, __scenario: scenario }, { signal }),
    [query, scenario]
  )
  const { data, error, loading, retry } = useRemote(serialized + scenario, fetcher)
  const selectedId = searchParams.get('transaction')
  const filtered = Boolean(query.q || query.type || query.status || query.currency || query.from || query.to)
  const clear = () =>
    updateQuery({
      q: undefined,
      type: undefined,
      status: undefined,
      currency: undefined,
      from: undefined,
      to: undefined,
      page: undefined,
    })
  const meta = data?.meta
  const page = query.page ?? 1

  useEffect(() => {
    if (!loading && !error && meta && page > meta.totalPages)
      updateQuery({ page: String(meta.totalPages) }, true)
  }, [loading, error, meta, page])

  const groups = new Map<string, NonNullable<typeof data>['data']>()
  for (const transaction of data?.data ?? []) {
    const label = groupLabel(transaction.createdAt)
    groups.set(label, [...(groups.get(label) ?? []), transaction])
  }
  const totalPages = meta?.totalPages ?? 1
  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <h1>Transactions</h1>
        <p aria-live="polite">
          {meta
            ? `${meta.total.toLocaleString()} ${filtered ? 'results' : 'transactions'}`
            : 'Your transaction history'}
        </p>
      </header>
      <div className={styles.filters}>
        <Search initial={query.q ?? ''} />
        <Select
          label="Type"
          value={query.type ?? ''}
          options={[
            { value: '', label: 'All types' },
            ...Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => ({ value, label })),
          ]}
          onChange={(event) => updateQuery({ type: event.target.value, page: undefined })}
        />
        <Select
          label="Status"
          value={query.status ?? ''}
          options={[
            { value: '', label: 'All statuses' },
            ...Object.entries(TRANSACTION_STATUS_LABELS).map(([value, label]) => ({ value, label })),
            { value: 'reversed', label: 'Reversed' },
          ]}
          onChange={(event) => updateQuery({ status: event.target.value, page: undefined })}
        />
        {filtered && (
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear filters
          </Button>
        )}
      </div>
      {(query.currency || query.from || query.to) && (
        <p className={styles.extraFilters}>
          Also filtering by{' '}
          {[query.currency, query.from && `from ${query.from}`, query.to && `to ${query.to}`]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
      <section className={styles.list} aria-label="Transaction history" aria-busy={loading}>
        {error ? (
          <EmptyState kind="error" onAction={retry} />
        ) : !data ? (
          <LoadingRows />
        ) : !data.data.length ? (
          <EmptyState kind={filtered ? 'filtered' : 'empty'} onAction={filtered ? clear : undefined} />
        ) : (
          Array.from(groups, ([label, transactions]) => (
            <div key={label}>
              <h2 className={styles.groupHeading}>{label}</h2>
              {transactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  onSelect={(tx) => updateQuery({ transaction: tx.id })}
                />
              ))}
            </div>
          ))
        )}
      </section>
      <span className="visually-hidden" role="status">
        {loading && data ? 'Updating transactions…' : ''}
      </span>
      {meta && meta.total > 0 && !error && (
        <footer className={styles.footer}>
          <p className={styles.range}>
            Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of{' '}
            {meta.total}
          </p>
          <nav className={styles.pagination} aria-label="Transaction pages">
            <Button
              variant="secondary"
              size="sm"
              iconLeft="chevron-left"
              disabled={page <= 1 || loading}
              onClick={() => updateQuery({ page: String(page - 1) })}
            >
              <span className={styles.previousDesktop}>Previous</span>
              <span className={styles.previousMobile}>Prev</span>
            </Button>
            <div className={styles.pageNumbers}>
              {pageNumbers(page, totalPages).map((number, index) =>
                number === 'ellipsis' ? (
                  <span key={`gap-${index}`}>…</span>
                ) : (
                  <button
                    type="button"
                    key={number}
                    aria-label={`Page ${number}`}
                    aria-current={number === page ? 'page' : undefined}
                    disabled={loading}
                    onClick={() => updateQuery({ page: String(number) })}
                  >
                    {number}
                  </button>
                )
              )}
            </div>
            <span className={styles.mobilePage}>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              iconRight="chevron-right"
              disabled={page >= totalPages || loading}
              onClick={() => updateQuery({ page: String(page + 1) })}
            >
              Next
            </Button>
          </nav>
        </footer>
      )}
      <Drawer
        open={Boolean(selectedId)}
        title="Transaction details"
        onClose={() => updateQuery({ transaction: undefined })}
      >
        {selectedId && (
          <TransactionDetails
            key={selectedId}
            id={selectedId}
            onClose={() => updateQuery({ transaction: undefined })}
          />
        )}
      </Drawer>
    </div>
  )
}
