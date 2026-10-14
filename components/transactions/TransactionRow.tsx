import type { Transaction, TransactionType } from '@/types/api'
import { Icon, type IconName, Money } from '@/components/ui'
import { formatTime, TRANSACTION_TYPE_LABELS } from '@/lib/format'
import { TransactionStatusBadge } from './TransactionStatusBadge'
import styles from './TransactionRow.module.css'

export const TYPE_ICONS: Record<TransactionType, IconName> = {
  deposit: 'arrow-down-left',
  transfer_in: 'arrow-down-left',
  withdrawal: 'arrow-up-right',
  transfer_out: 'arrow-up-right',
  conversion: 'swap',
  card_payment: 'card',
  bill_payment: 'receipt',
}

export const CREDIT_TYPES: TransactionType[] = ['deposit', 'transfer_in', 'conversion']

export function TransactionIcon({ transaction: tx }: { transaction: Transaction }) {
  const initials = tx.counterparty
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((name) => name[0])
    .join('')
  return (
    <span className={styles.icon} aria-hidden="true">
      {initials && (tx.type === 'transfer_in' || tx.type === 'transfer_out') ? (
        initials
      ) : (
        <Icon name={TYPE_ICONS[tx.type]} size={18} />
      )}
    </span>
  )
}

export interface TransactionRowProps {
  transaction: Transaction
  onSelect?: (transaction: Transaction) => void
}

export function TransactionRow({ transaction: tx, onSelect }: TransactionRowProps) {
  const isCredit = CREDIT_TYPES.includes(tx.type)

  return (
    <button type="button" className={styles.row} onClick={() => onSelect?.(tx)}>
      <TransactionIcon transaction={tx} />
      <span className={styles.main}>
        <span className={styles.title}>{TRANSACTION_TYPE_LABELS[tx.type]}</span>
        <span className={styles.narration}>{tx.narration}</span>
      </span>
      <span className={styles.desktopStatus}>
        <TransactionStatusBadge status={tx.status} />
      </span>
      <span className={styles.end}>
        <Money
          amount={tx.amount}
          currency={tx.currency}
          sign={isCredit ? 'credit' : 'debit'}
          className={isCredit ? styles.credit : styles.amount}
        />
        <span className={styles.meta}>{formatTime(tx.createdAt)}</span>
        <span className={styles.mobileStatus}>
          <TransactionStatusBadge status={tx.status} />
        </span>
      </span>
    </button>
  )
}
