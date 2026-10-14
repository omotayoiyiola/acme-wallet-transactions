import type { Currency } from '@/types/api'
import { cx } from '@/lib/cx'
import styles from './Money.module.css'
import { formatMoney } from '@/lib/format'

export interface MoneyProps {
  /** Minor units. */
  amount: number
  currency: Currency
  /** Prefix with + or -. */
  sign?: 'credit' | 'debit'
  className?: string
}

export function Money({ amount, currency, sign, className }: MoneyProps) {
  return (
    <span className={cx(styles.money, className)}>
      {formatMoney(sign === 'debit' ? -amount : amount, currency, { signDisplay: sign ? 'always' : 'auto' })}
    </span>
  )
}
