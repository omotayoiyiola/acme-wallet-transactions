import { act, renderHook, waitFor } from '@testing-library/react'
import { useRemote } from './useRemote'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

it('keeps previous results and prevents slow, superseded responses overwriting newer data', async () => {
  const initial = deferred<string>()
  const slow = deferred<string>()
  const fast = deferred<string>()
  let slowSignal: AbortSignal | undefined
  const first = () => initial.promise
  const second = (signal: AbortSignal) => {
    slowSignal = signal
    return slow.promise
  }
  const third = () => fast.promise
  const { result, rerender } = renderHook(({ key, fetcher }) => useRemote(key, fetcher), {
    initialProps: { key: 'one', fetcher: first as (signal: AbortSignal) => Promise<string> },
  })
  await act(async () => initial.resolve('initial'))
  rerender({ key: 'two', fetcher: second })
  expect(result.current.data).toBe('initial')
  expect(result.current.loading).toBe(true)
  rerender({ key: 'three', fetcher: third })
  expect(slowSignal?.aborted).toBe(true)
  await act(async () => fast.resolve('newest'))
  await act(async () => slow.resolve('stale'))
  expect(result.current.data).toBe('newest')
})

it('exposes failures and retries the same request', async () => {
  let calls = 0
  const fetcher = async () => {
    if (calls++ === 0) throw new Error('offline')
    return 'recovered'
  }
  const { result } = renderHook(() => useRemote('key', fetcher))
  await waitFor(() => expect(result.current.error?.message).toBe('offline'))
  act(() => result.current.retry())
  await waitFor(() => expect(result.current.data).toBe('recovered'))
  expect(result.current.error).toBeUndefined()
})
