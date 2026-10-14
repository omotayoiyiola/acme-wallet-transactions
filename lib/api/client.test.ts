import { api, ApiError } from './client'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => vi.unstubAllGlobals())

describe('API client', () => {
  it.each([
    [404, '<html>Not found</html>'],
    [502, 'Bad gateway'],
    [503, ''],
  ])('preserves HTTP %s when the error body is not JSON', async (status, body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status })))
    await expect(api.get('/transactions/missing')).rejects.toMatchObject({
      name: 'ApiError',
      status,
      code: 'HTTP_ERROR',
      message: 'Unable to complete the request.',
    })
  })

  it('does not treat a malformed successful response as valid data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not JSON', { status: 200 })))
    await expect(api.get('/transactions')).rejects.toMatchObject({ name: 'SyntaxError' })
  })

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
