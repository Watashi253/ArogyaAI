import { useCallback, useEffect, useRef, useState } from 'react'
import { getErrorMessage } from '@/utils/errors'

export function useAsync(asyncFn, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(immediate)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const execute = useCallback(
    async (...args) => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await asyncFn(...args)
        if (mountedRef.current) setData(result)
        return result
      } catch (err) {
        const message = getErrorMessage(err)
        if (mountedRef.current) setError(message)
        throw err
      } finally {
        if (mountedRef.current) setIsLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  )

  useEffect(() => {
    if (immediate) execute()
  }, [execute, immediate])

  return { data, error, isLoading, execute, setData }
}
