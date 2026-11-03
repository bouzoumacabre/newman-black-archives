import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AdminLayout } from '../components/admin/AdminLayout'
import { usePolling } from '../hooks/usePolling'
import { useToast } from '../components/ui/Toast'
import { humanizeError } from '../lib/errors'
import type { AccountStatus, Profile, UserRole } from '../types'

const ROLE_LABEL: Record<UserRole, string> = { player: 'AGENT', manager: 'EMPLOYÉ', admin: 'ADMIN' }

export function AdminAccountsPage() {
  const { pushToast } = useToast()
  const [accounts, setAccounts] = useState<Profile[]>([])

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*').neq('role', 'admin').order('created_at', { ascending: false })
    if (error) pushToast(humanizeError(error), 'danger')
    else setAccounts((data ?? []) as Profile[])
  }, [pushToast])

  useEffect(() => { void load() }, [load])
  usePolling(load, 8000)

  const review = async (id: string, status: AccountStatus, role?: UserRole) => {
    const { error } = await supabase.rpc('review_account', { p_user_id: id, p_status: status, p_role: role ?? null })
    if (error) pushToast(humanizeError(error), 'danger')
    else pushToast(status === 'approved' ? '[ok] ACCÈS ACCORDÉ' : '[ok] ACCÈS MODIFIÉ', 'success')
    await load()
  }

  const pending = accounts.filter((a) => a.status === 'pending')
  const members = accounts.filter((a) => a.status === 'approved')
  const rejected = accounts.filter((a) => a.status === 'rejected')

  return (
    <AdminLayout>
      <section className="admin-panel">
        <div className="terminal-label">DEMANDES EN ATTENTE ({pending.length})</div>
        {pending.length === 0 && <div className="empty-terminal">aucune demande.</div>}
        {pending.map((a) => (
          <div key={a.user_id} className="mission-card">
            <div className="mission-head">
              <strong>{a.username}</strong>
              <small>{new Date(a.created_at).toLocaleString('fr-FR')}</small>
            </div>
            <div className="review-actions">
              <button className="terminal-button success-button" onClick={() => void review(a.user_id, 'approved', 'player')}>[ ACCEPTER · AGENT ]</button>
              <button className="terminal-button" onClick={() => void review(a.user_id, 'approved', 'manager')}>[ ACCEPTER · EMPLOYÉ ]</button>
              <button className="terminal-button danger-button" onClick={() => void review(a.user_id, 'rejected')}>[ REFUSER ]</button>
            </div>
          </div>
        ))}
      </section>

      <section className="admin-panel">
        <div className="terminal-label">MEMBRES ({members.length})</div>
        {members.length === 0 && <div className="empty-terminal">aucun membre.</div>}
        {members.map((a) => (
          <div key={a.user_id} className="mission-card">
            <div className="mission-head">
              <strong>{a.username}</strong>
              <select className="inline-select" value={a.role} onChange={(e) => void review(a.user_id, 'approved', e.target.value as UserRole)}>
                <option value="player">{ROLE_LABEL.player}</option>
                <option value="manager">{ROLE_LABEL.manager}</option>
              </select>
              <button className="link-button" onClick={() => void review(a.user_id, 'rejected')}>RÉVOQUER</button>
            </div>
          </div>
        ))}
      </section>

      {rejected.length > 0 && (
        <section className="admin-panel">
          <div className="terminal-label">REFUSÉS ({rejected.length})</div>
          {rejected.map((a) => (
            <div key={a.user_id} className="mission-card">
              <div className="mission-head">
                <strong>{a.username}</strong>
                <button className="link-button" onClick={() => void review(a.user_id, 'approved', 'player')}>RÉTABLIR</button>
              </div>
            </div>
          ))}
        </section>
      )}
    </AdminLayout>
  )
}
