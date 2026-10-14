import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useSyncExternalStore } from 'react'
import { TransactionsPage } from './TransactionsPage'
import { getTransactions } from '@/lib/api/endpoints'

vi.mock('next/navigation', () => ({
  useSearchParams: () => {
    const value = useSyncExternalStore(
      (listener) => {
        window.addEventListener('popstate', listener)
        return () => window.removeEventListener('popstate', listener)
      },
      () => window.location.search
    )
    return new URLSearchParams(value)
  },
}))
vi.mock('@/lib/api/endpoints', () => ({ getTransactions: vi.fn(), getTransaction: vi.fn() }))

const response = { data: [], meta: { total: 0, page: 1, totalPages: 1, limit: 20 } }
const realPush = window.history.pushState.bind(window.history)
beforeEach(() => {
  window.history.replaceState(null, '', '/transactions')
  vi.mocked(getTransactions).mockResolvedValue(response)
  vi.spyOn(window.history, 'pushState').mockImplementation((state, unused, url) => {
    realPush(state, unused, url)
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('restores filters from a URL, resets the page on filter change and clears filters', async () => {
  window.history.replaceState(null, '', '/transactions?page=2&type=deposit&status=pending')
  render(<TransactionsPage />)
  await screen.findByText('No transactions match your filters')
  expect(screen.getByLabelText('Type')).toHaveValue('deposit')
  fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'failed' } })
  expect(window.location.search).toContain('status=failed')
  expect(new URLSearchParams(window.location.search).has('page')).toBe(false)
  fireEvent.click(screen.getAllByRole('button', { name: 'Clear filters' })[0])
  await screen.findByText('No transactions yet')
  expect(window.location.search).toBe('')
})

it('debounces search and commits it to the shareable URL', async () => {
  render(<TransactionsPage />)
  fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'Netflix' } })
  await waitFor(() => expect(window.location.search).toContain('q=Netflix'))
  await waitFor(() =>
    expect(getTransactions).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: 'Netflix', page: 1 }),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  )
})

it('shows API errors and lets the user retry', async () => {
  vi.mocked(getTransactions).mockRejectedValueOnce(new Error('offline')).mockResolvedValue(response)
  render(<TransactionsPage />)
  fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
  await screen.findByText('No transactions yet')
})

it('preserves the design-only Reversed filter in a shared link and requests matching results', async () => {
  window.history.replaceState(null, '', '/transactions?status=reversed')
  render(<TransactionsPage />)
  await screen.findByText('No transactions match your filters')
  expect(screen.getByLabelText('Status')).toHaveValue('reversed')
  expect(getTransactions).toHaveBeenLastCalledWith(
    expect.objectContaining({ status: 'reversed' }),
    expect.objectContaining({ signal: expect.any(AbortSignal) })
  )
  fireEvent.click(screen.getAllByRole('button', { name: 'Clear filters' })[0])
  await screen.findByText('No transactions yet')
  expect(window.location.search).toBe('')
})
