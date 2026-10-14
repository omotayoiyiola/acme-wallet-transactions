import { Suspense } from 'react'
import { TransactionsPage } from '@/components/transactions/TransactionsPage'

export const metadata = { title: 'Transactions' }

export default function Page() {
  return (
    <Suspense fallback={<p role="status">Loading transactions…</p>}>
      <TransactionsPage />
    </Suspense>
  )
}
