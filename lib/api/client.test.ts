import { api, ApiError } from './client'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => vi.unstubAllGlobals())

describe('API client', () => {
  it('throws typed backend errors instead of treating failures as data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Missing transaction' } }), {
          status: 404,
        })
      )
    )
    await expect(api.get('/transactions/missing')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      code: 'NOT_FOUND',
      message: 'Missing transaction',
    })
  })
  it('preserves cancellation and successful response metadata', async () => {
    const response = { data: [], meta: { page: 1, total: 0, limit: 20, totalPages: 1 } }
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(response)))
    vi.stubGlobal('fetch', fetch)
    const controller = new AbortController()
    await expect(api.get('/transactions', { signal: controller.signal })).resolves.toEqual(response)
    expect(fetch.mock.calls[0][1].signal).toBe(controller.signal)
    expect(new ApiError(500, 'SERVER', 'Try again')).toBeInstanceOf(Error)
  })
})
