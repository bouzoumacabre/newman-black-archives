import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AdminLayout } from '../components/admin/AdminLayout'
import { usePolling } from '../hooks/usePolling'
import { useToast } from '../components/ui/Toast'
import { humanizeError } from '../lib/errors'
import type { PlayerProgress, Profile } from '../types'

interface PlayerRow extends Profile {
  player_progress?: Pick<PlayerProgress, 'phase_no' | 'completed_at'>[]
}

export function AdminPlayersPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([])
  const [search, setSearch] = useState('')
  const { pushToast } = useToast()

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, player_progress(phase_no,completed_at)')
      .eq('role', 'player')
      .order('created_at', { ascending: false })

    if (error) {
      pushToast(humanizeError(error), 'danger')
      return
    }
    setPlayers((data ?? []) as PlayerRow[])
  }, [pushToast])

  useEffect(() => { void load() }, [load])
  usePolling(load, 8000)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return players
    return players.filter((player) => player.username.toLowerCase().includes(q))
  }, [players, search])

  return (
    <AdminLayout>
      <section className="admin-panel">
        <div className="admin-panel-title-row">
          <div className="terminal-label">GHOST IDENTITIES</div>
          <input className="admin-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="RECHERCHER ALIAS" />
        </div>
        {visible.length === 0 ? <div className="empty-terminal">aucune identité correspondante.</div> : (
          <div className="player-grid">
            {visible.map((player) => {
              const maxPhase = Math.max(1, ...(player.player_progress ?? []).map((row) => row.phase_no))
              const cleared = (player.player_progress ?? []).filter((row) => row.completed_at).length
              return (
                <Link key={player.user_id} className="player-card" to={`/control/players/${player.user_id}`}>
                  <strong>{player.username}</strong>
                  <span>CLEARANCE PH-{maxPhase} · {cleared}/4 CLEAR</span>
                  <small>créée {new Date(player.created_at).toLocaleString('fr-FR')}</small>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </AdminLayout>
  )
}
