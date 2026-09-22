import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AdminLayout } from '../components/admin/AdminLayout'
import { usePolling } from '../hooks/usePolling'
import { useToast } from '../components/ui/Toast'
import { humanizeError } from '../lib/errors'

interface Row {
  id: string
  phase_no: number
  coordinates: string
  message: string | null
  created_at: string
  profiles?: { username: string } | null
}

export function AdminTransmissionsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [search, setSearch] = useState('')
  const { pushToast } = useToast()

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('transmissions')
      .select('*, profiles!transmissions_user_id_fkey(username)')
      .order('created_at', { ascending: false })

    if (error) {
      pushToast(humanizeError(error), 'danger')
      return
    }
    setRows((data ?? []) as Row[])
  }, [pushToast])

  useEffect(() => { void load() }, [load])
  usePolling(load, 8000)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => (row.profiles?.username ?? '').toLowerCase().includes(q) || row.coordinates.toLowerCase().includes(q))
  }, [rows, search])

  return (
    <AdminLayout>
      <section className="admin-panel">
        <div className="admin-panel-title-row">
          <div className="terminal-label">TRANSMISSIONS SENT</div>
          <input className="admin-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ALIAS / COORDONNÉES" />
        </div>
        <div className="admin-table admin-table-transmissions">
          <div className="admin-table-head"><span>PLAYER</span><span>PHASE</span><span>COORDONNÉES</span><span>DATE</span></div>
          {visible.map((row) => (
            <div className="admin-table-row static" key={row.id} title={row.message ?? undefined}>
              <span>{row.profiles?.username ?? '?'}</span>
              <span>PH-{row.phase_no}</span>
              <span className="coordinates-cell">{row.coordinates}</span>
              <span>{new Date(row.created_at).toLocaleString('fr-FR')}</span>
            </div>
          ))}
        </div>
        {visible.length === 0 && <div className="empty-terminal">aucune transmission.</div>}
      </section>
    </AdminLayout>
  )
}
