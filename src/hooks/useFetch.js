import { useCallback, useEffect, useState } from 'react'

export default function useFetch(fetcher) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await fetcher())
    } catch (nextError) {
      setError(nextError)
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  useEffect(() => {
    const timer = setTimeout(() => { void refetch() }, 0)
    return () => clearTimeout(timer)
  }, [refetch])
  return { data, loading, error, refetch }
}
