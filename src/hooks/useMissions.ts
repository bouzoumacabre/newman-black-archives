import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { usePolling } from './usePolling'
import { humanizeError } from '../lib/errors'
import type { Mission } from '../types'

// RLS decides the scope: an agent only gets their own rows, an admin gets all of them.
export function useMissions() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const { data, error: err } = await supabase.from('missions').select('*').order('created_at', { ascending: false })
    if (err) setError(humanizeError(err))
    else {
      setMissions((data ?? []) as Mission[])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  usePolling(refresh, 8000)

  return { missions, loading, error, refresh }
}
