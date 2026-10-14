import { pageNumbers, readTransactionQuery } from './query'

describe('transaction links', () => {
  it('normalizes invalid pagination and rejects unknown filters and impossible dates', () => {
    expect(
      readTransactionQuery(new URLSearchParams('page=-2&type=__proto__&status=bad&from=2026-02-30'))
    ).toMatchObject({ page: 1, limit: 20, type: undefined, status: undefined, from: undefined })
  })
  it('restores all supported API filters from a shared link', () => {
    expect(
      readTransactionQuery(
        new URLSearchParams(
          'page=3&q=+Netflix+&type=card_payment&status=pending&currency=USD&from=2026-10-01'
        )
      )
    ).toMatchObject({
      page: 3,
      q: 'Netflix',
      type: 'card_payment',
      status: 'pending',
      currency: 'USD',
      from: '2026-10-01',
    })
  })
  it('keeps current and boundary pages reachable without rendering every page', () => {
    expect(pageNumbers(1, 12)).toEqual([1, 2, 3, 'ellipsis', 12])
    expect(pageNumbers(6, 12)).toEqual([1, 'ellipsis', 5, 6, 7, 'ellipsis', 12])
  })
})
