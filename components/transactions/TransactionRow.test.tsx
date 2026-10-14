import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransactionRow } from './TransactionRow'
import type { Transaction } from '@/types/api'

const transaction: Transaction = {
  id: 'txn_1',
  reference: 'ACM-1',
  type: 'transfer_out',
  status: 'successful',
  currency: 'GHS',
  amount: 120000,
  fee: 1200,
  narration: '<img src=x onerror=alert(1)>',
  counterparty: 'Kwame Mensah',
  createdAt: '2026-10-05T10:15:00Z',
}

it('renders untrusted narration as text and formats the actual transaction currency', async () => {
  const onSelect = vi.fn()
  const { container } = render(<TransactionRow transaction={transaction} onSelect={onSelect} />)
  expect(screen.getByText(transaction.narration)).toBeInTheDocument()
  expect(container.querySelector('img')).toBeNull()
  expect(screen.getByText('-GH₵1,200.00')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button'))
  expect(onSelect).toHaveBeenCalledWith(transaction)
})
