import { useCallback, useEffect, useState } from 'react'
import { service } from '@/services/dataService'
import type { LeadListResponse, LeadQuery } from '@/types/lead'

interface UseLeadsResult {
  data: LeadListResponse | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useLeads(query: LeadQuery, deps: unknown[] = []): UseLeadsResult {
  const [data, setData] = useState<LeadListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const refetch = useCallback(() => setNonce((value) => value + 1), [])

  const queryKey = JSON.stringify(query)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    service
      .listLeads(query)
      .then((response) => {
        if (active) setData(response)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load leads')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, nonce, ...deps])

  return { data, loading, error, refetch }
}
