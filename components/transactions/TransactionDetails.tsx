'use client'
import { useCallback, useState } from 'react'
import { Button, Icon, Money } from '@/components/ui'
import { getTransaction } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/client'
import { formatDateTime, TRANSACTION_TYPE_LABELS } from '@/lib/format'
import { CREDIT_TYPES, TransactionIcon } from './TransactionRow'
import { TransactionStatusBadge } from './TransactionStatusBadge'
import { EmptyState } from './TransactionStates'
import { useRemote } from './useRemote'
import styles from './TransactionsPage.module.css'

export function TransactionDetails({ id, onClose }: { id: string; onClose: () => void }) {
  const fetcher = useCallback((signal: AbortSignal) => getTransaction(id, { signal }), [id])
  const { data, loading, error, retry } = useRemote(id, fetcher)
  const [copyStatus, setCopyStatus] = useState('')
  if (loading)
    return (
      <div className={styles.detailSkeleton} role="status" aria-label="Loading transaction details">
        <span className="visually-hidden">Loading transaction details…</span>
        <div aria-hidden="true">
          <i />
          <b />
          <b />
          <b />
        </div>
        {Array.from({ length: 4 }, (_, index) => (
          <p key={index} aria-hidden="true">
            <b />
            <b />
          </p>
        ))}
      </div>
    )
  if (error)
    return (
      <EmptyState
        kind={error instanceof ApiError && error.status === 404 ? 'not-found' : 'error'}
        onAction={error instanceof ApiError && error.status === 404 ? onClose : retry}
      />
    )
  const tx = data?.data
  if (!tx) return null
  return (
    <>
      <div className={styles.detailHero}>
        <TransactionIcon transaction={tx} />
        <p>{tx.narration}</p>
        <Money
          amount={tx.amount}
          currency={tx.currency}
          sign={CREDIT_TYPES.includes(tx.type) ? 'credit' : 'debit'}
          className={styles.detailAmount}
        />
        <TransactionStatusBadge status={tx.status} />
      </div>
      <h3 className={styles.detailLabel}>Details</h3>
      <dl className={styles.details}>
        <dt>Reference</dt>
        <dd className={styles.reference}>
          <span>{tx.reference}</span>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Copy reference"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(tx.reference)
                setCopyStatus('Reference copied')
              } catch {
                setCopyStatus('Unable to copy. Select and copy the reference manually.')
              }
            }}
          >
            <Icon name="copy" size={14} />
          </Button>
        </dd>
        <dt>Date</dt>
        <dd>{formatDateTime(tx.createdAt)}</dd>
        <dt>Type</dt>
        <dd>{TRANSACTION_TYPE_LABELS[tx.type]}</dd>
        <dt>Counterparty</dt>
        <dd>{tx.counterparty ?? '—'}</dd>
        <dt>Narration</dt>
        <dd>{tx.narration}</dd>
      </dl>
      <p role="status" className={copyStatus ? styles.copyStatus : 'visually-hidden'}>
        {copyStatus}
      </p>
      <h3 className={styles.detailLabel}>Summary</h3>
      <dl className={styles.details}>
        <dt>Amount</dt>
        <dd>
          <Money amount={tx.amount} currency={tx.currency} />
        </dd>
        <dt>Fee</dt>
        <dd>
          <Money amount={tx.fee} currency={tx.currency} />
        </dd>
      </dl>
      <div className={styles.total}>
        <span>Total</span>
        <Money amount={tx.amount + tx.fee} currency={tx.currency} />
      </div>
    </>
  )
}
