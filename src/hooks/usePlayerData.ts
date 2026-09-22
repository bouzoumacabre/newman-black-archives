import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { ActivityEvent, OperatorMessage, PlayerProgress, Submission, Transmission } from '../types'
import { usePolling } from './usePolling'
import { humanizeError } from '../lib/errors'

export function usePlayerData() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<PlayerProgress[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [transmissions, setTransmissions] = useState<Transmission[]>([])
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [messages, setMessages] = useState<OperatorMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setProgress([])
      setSubmissions([])
      setTransmissions([])
      setEvents([])
      setMessages([])
      setLoading(false)
      return
    }

    try {
      // Explicit filters are intentional: admin RLS can see all rows, while this hook
      // always represents only the currently authenticated identity.
      const [progressRes, submissionsRes, transmissionsRes, eventsRes, messagesRes] = await Promise.all([
        supabase.from('player_progress').select('*').eq('user_id', user.id).order('phase_no'),
        supabase.from('submissions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('transmissions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('activity_events').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(40),
        supabase.from('operator_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      ])
      const firstError = progressRes.error || submissionsRes.error || transmissionsRes.error || eventsRes.error || messagesRes.error
      if (firstError) throw firstError
      setProgress((progressRes.data ?? []) as PlayerProgress[])
      setSubmissions((submissionsRes.data ?? []) as Submission[])
      setTransmissions((transmissionsRes.data ?? []) as Transmission[])
      setEvents((eventsRes.data ?? []) as ActivityEvent[])
      setMessages((messagesRes.data ?? []) as OperatorMessage[])
      setError(null)
    } catch (err) {
      setError(humanizeError(err))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    setLoading(true)
    void refresh()
  }, [refresh])
  usePolling(refresh, 8000, Boolean(user))

  const maxPhase = useMemo(() => progress.length ? Math.max(...progress.map((item) => item.phase_no)) : 1, [progress])

  return { progress, submissions, transmissions, events, messages, loading, error, refresh, maxPhase }
}
