'use client'
import { useEffect, useState } from 'react'

/** Keep the last result during refreshes; abort and ignore superseded requests. */
export function useRemote<T>(key: string, fetcher: (signal: AbortSignal) => Promise<T>) {
  const [attempt, setAttempt] = useState(0)
  const requestKey = `${key}:${attempt}`
  const [result, setResult] = useState<{ key: string; data?: T; error?: Error }>({ key: '' })
  useEffect(() => {
    const controller = new AbortController()
    fetcher(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, data })
      },
      (error: unknown) => {
        if (!controller.signal.aborted)
          setResult((previous) => ({
            key: requestKey,
            data: previous.data,
            error: error instanceof Error ? error : new Error('Request failed'),
          }))
      }
    )
    return () => controller.abort()
  }, [requestKey, fetcher])
  return {
    data: result.data,
    error: result.key === requestKey ? result.error : undefined,
    loading: result.key !== requestKey,
    retry: () => setAttempt((value) => value + 1),
  }
}
