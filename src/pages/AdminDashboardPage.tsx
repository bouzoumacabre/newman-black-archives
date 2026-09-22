import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AdminLayout } from '../components/admin/AdminLayout'
import { usePolling } from '../hooks/usePolling'
import { useToast } from '../components/ui/Toast'
import { humanizeError } from '../lib/errors'

interface Counts {
  players: number
  pending: number
  approved: number
  rejected: number
  transmissions: number
}

interface AdminActivityRow {
  id: string
  label: string
  created_at: string
  user_id: string
  profiles?: { username: string } | null
}

export function AdminDashboardPage() {
  const [counts, setCounts] = useState<Counts>({ players: 0, pending: 0, approved: 0, rejected: 0, transmissions: 0 })
  const [activities, setActivities] = useState<AdminActivityRow[]>([])
  const [syncing, setSyncing] = useState(true)
  const { pushToast } = useToast()

  const load = useCallback(async () => {
    try {
      const [players, pending, approved, rejected, transmissions, events] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'player'),
        supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
        supabase.from('transmissions').select('*', { count: 'exact', head: true }),
        supabase
          .from('activity_events')
          .select('id,label,created_at,user_id,profiles!activity_events_user_id_fkey(username)')
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      const error = players.error || pending.error || approved.error || rejected.error || transmissions.error || events.error
      if (error) throw error

      setCounts({
        players: players.count ?? 0,
        pending: pending.count ?? 0,
        approved: approved.count ?? 0,
        rejected: rejected.count ?? 0,
        transmissions: transmissions.count ?? 0,
      })
      setActivities((events.data ?? []) as unknown as AdminActivityRow[])
    } catch (error) {
      pushToast(humanizeError(error), 'danger')
    } finally {
      setSyncing(false)
    }
  }, [pushToast])

  useEffect(() => { void load() }, [load])
  usePolling(load, 8000)

  return (
    <AdminLayout>
      <div className="admin-metrics">
        <Metric label="ACTIVE GHOSTS" value={counts.players} />
        <Metric label="PENDING ANALYSES" value={counts.pending} warning />
        <Metric label="APPROVED" value={counts.approved} />
        <Metric label="REJECTED" value={counts.rejected} danger />
        <Metric label="TRANSMISSIONS SENT" value={counts.transmissions} />
      </div>
      <section className="admin-panel">
        <div className="admin-panel-title-row">
          <div className="terminal-label">LATEST ACTIVITY</div>
          <span className="sync-indicator">{syncing ? 'SYNC...' : 'LIVE // 8s'}</span>
        </div>
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

function Metric({ label, value, warning, danger }: { label: string; value: number; warning?: boolean; danger?: boolean }) {
  return <div className={`metric ${warning ? 'warning' : ''} ${danger ? 'danger' : ''}`}><small>{label}</small><strong>{value}</strong></div>
}
