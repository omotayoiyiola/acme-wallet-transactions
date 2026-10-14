import { Badge, type BadgeTone } from '@/components/ui'
import { TRANSACTION_STATUS_LABELS } from '@/lib/format'
import type { TransactionStatus } from '@/types/api'

const tones: Record<TransactionStatus, BadgeTone> = {
  successful: 'success',
  pending: 'warning',
  failed: 'danger',
}
export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <Badge dot tone={tones[status]}>
      {TRANSACTION_STATUS_LABELS[status]}
    </Badge>
  )
}
