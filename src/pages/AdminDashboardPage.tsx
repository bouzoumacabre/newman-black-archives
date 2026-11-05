import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AdminLayout } from '../components/admin/AdminLayout'
import { HackFeed } from '../components/animations/HackFeed'
import { BroadcastPanel } from '../components/admin/BroadcastPanel'
import { usePolling } from '../hooks/usePolling'
import { useToast } from '../components/ui/Toast'
import { humanizeError } from '../lib/errors'

interface AdminActivityRow {
  id: string
  label: string
  created_at: string
  user_id: string
  profiles?: { username: string } | null
}

const countMissions = (status: string) =>
  supabase.from('missions').select('*', { count: 'exact', head: true }).eq('status', status)

export function AdminDashboardPage() {
  const [counts, setCounts] = useState({ agents: 0, active: 0, waiting: 0, validated: 0 })
  const [activities, setActivities] = useState<AdminActivityRow[]>([])
  const { pushToast } = useToast()

  const load = useCallback(async () => {
    try {
      const [agents, active, waiting, validated, events] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'player'),
        countMissions('active'),
        countMissions('awaiting_validation'),
        countMissions('validated'),
        supabase
          .from('activity_events')
          .select('id,label,created_at,user_id,profiles!activity_events_user_id_fkey(username)')
          .order('created_at', { ascending: false })
          .limit(20),
      ])
      const error = agents.error || active.error || waiting.error || validated.error || events.error
      if (error) throw error
      setCounts({ agents: agents.count ?? 0, active: active.count ?? 0, waiting: waiting.count ?? 0, validated: validated.count ?? 0 })
      setActivities((events.data ?? []) as unknown as AdminActivityRow[])
    } catch (error) {
      pushToast(humanizeError(error), 'danger')
    }
  }, [pushToast])

  useEffect(() => { void load() }, [load])
  usePolling(load, 8000)

  return (
    <AdminLayout>
      <div className="admin-metrics">
        <Metric label="AGENTS" value={counts.agents} />
        <Metric label="EN COURS" value={counts.active} />
        <Metric label="TERMINÉES" value={counts.waiting + counts.validated} />
        <Metric label="À VALIDER" value={counts.waiting} warning />
        <Metric label="VALIDÉES" value={counts.validated} />
      </div>
      <BroadcastPanel />
      <HackFeed lines={5} />
      <section className="admin-panel">
        <div className="terminal-label">DERNIÈRE ACTIVITÉ</div>
        <div className="admin-log">
          {activities.length === 0 && <div className="empty-terminal">aucune activité récupérée.</div>}
          {activities.map((event) => (
            <div key={event.id}>
              <time>{new Date(event.created_at).toLocaleString('fr-FR')}</time>
              <span>{event.label}</span>
              <small>{event.profiles?.username ?? event.user_id.slice(0, 8)}</small>
            </div>
          ))}
        </div>
      </section>
    </AdminLayout>
  )
}

function Metric({ label, value, warning }: { label: string; value: number; warning?: boolean }) {
  return <div className={`metric ${warning ? 'warning' : ''}`}><small>{label}</small><strong>{value}</strong></div>
}
