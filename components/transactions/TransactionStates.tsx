import { Button, Icon } from '@/components/ui'
import styles from './TransactionsPage.module.css'

export function LoadingRows() {
  return (
    <div className={styles.skeleton} role="status" aria-label="Loading transactions">
      <span className="visually-hidden">Loading transactions…</span>
      {Array.from({ length: 6 }, (_, index) => (
        <div className={styles.skeletonRow} key={index} aria-hidden="true">
          <i />
          <div>
            <b />
            <b />
          </div>
          <div>
            <b />
            <b />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  kind,
  onAction,
}: {
  kind: 'empty' | 'filtered' | 'error' | 'not-found'
  onAction?: () => void
}) {
  const copy = {
    empty: [
      'No transactions yet',
      'When you add money, send a transfer or pay with your card, it will show up here.',
    ],
    filtered: ['No transactions match your filters', 'Try a different search term or remove some filters.'],
    error: ['We couldn’t load your transactions', 'Check your connection and try again.'],
    'not-found': ['Transaction not found', 'It may have been removed, or the link is wrong.'],
  }[kind]
  return (
    <div className={styles.empty} role={kind === 'error' ? 'alert' : 'status'}>
      <span className={kind === 'error' ? styles.errorIcon : styles.emptyIcon}>
        <Icon name={kind === 'error' ? 'alert' : kind === 'empty' ? 'inbox' : 'search'} />
      </span>
      <h2>{copy[0]}</h2>
      <p>{copy[1]}</p>
      {onAction && (
        <Button
          size="sm"
          variant={kind === 'error' ? 'primary' : 'secondary'}
          iconLeft={kind === 'error' ? 'refresh' : undefined}
          onClick={onAction}
        >
          {kind === 'error' ? 'Try again' : kind === 'filtered' ? 'Clear filters' : 'Back to transactions'}
        </Button>
      )}
    </div>
  )
}
