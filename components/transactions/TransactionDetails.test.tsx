import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TransactionDetails } from './TransactionDetails'
import { getTransaction } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/client'

vi.mock('@/lib/api/endpoints', () => ({ getTransaction: vi.fn() }))
afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

it('loads a linked transaction and includes the fee in its own currency', async () => {
  vi.mocked(getTransaction).mockResolvedValue({
    data: {
      id: 'txn_1',
      reference: 'ACM-1',
      type: 'transfer_out',
      status: 'successful',
      currency: 'GHS',
      amount: 120000,
      fee: 1200,
      narration: 'Transfer to Kwame Mensah',
      counterparty: 'Kwame Mensah',
      createdAt: '2026-10-05T10:15:00Z',
    },
  })
  render(<TransactionDetails id="txn_1" onClose={vi.fn()} />)
  expect(screen.getByRole('status', { name: 'Loading transaction details' })).toBeInTheDocument()
  expect(await screen.findByText('-GH₵1,200.00')).toBeInTheDocument()
  expect(screen.getByText('GH₵12.00')).toBeInTheDocument()
  expect(screen.getByText('GH₵1,212.00')).toBeInTheDocument()
})

it('distinguishes a missing transaction from a temporary server error', async () => {
  const onClose = vi.fn()
  vi.mocked(getTransaction).mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Missing'))
  render(<TransactionDetails id="missing" onClose={onClose} />)
  expect(await screen.findByText('Transaction not found')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Back to transactions' }))
  expect(onClose).toHaveBeenCalledOnce()
})

it('offers retry for a transient details failure', async () => {
  vi.mocked(getTransaction).mockRejectedValue(new ApiError(500, 'INTERNAL_ERROR', 'Try again'))
  render(<TransactionDetails id="txn_1" onClose={vi.fn()} />)
  expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
  expect(screen.queryByText('Transaction not found')).not.toBeInTheDocument()
})
