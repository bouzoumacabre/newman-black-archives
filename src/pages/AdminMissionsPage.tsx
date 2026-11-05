import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { AdminLayout } from '../components/admin/AdminLayout'
import { ConfirmButton } from '../components/ui/ConfirmButton'
import { StatusBadge } from '../components/ui/StatusBadge'
import { MissionImage } from '../components/ui/MissionImage'
import { useToast } from '../components/ui/Toast'
import { useMissions } from '../hooks/useMissions'
import { humanizeError } from '../lib/errors'
import type { Profile } from '../types'

const MAX_IMAGE = 5 * 1024 * 1024
const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

export function AdminMissionsPage() {
  const { user, profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const { pushToast } = useToast()
  const { missions, refresh } = useMissions()
  const [agents, setAgents] = useState<Profile[]>([])
  const [agentId, setAgentId] = useState('')
  const [title, setTitle] = useState('')
  const [brief, setBrief] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const loadAgents = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'player').eq('status', 'approved').order('username')
    if (error) pushToast(humanizeError(error), 'danger')
    else setAgents((data ?? []) as Profile[])
  }, [pushToast])
  useEffect(() => { void loadAgents() }, [loadAgents])

  const nameOf = (id: string) => agents.find((a) => a.user_id === id)?.username ?? id.slice(0, 8)

  const create = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user || busy) return
    if (!agentId || !title.trim()) {
      pushToast('[!!] AGENT ET TITRE REQUIS', 'warning')
      return
    }
    if (file && (!EXT[file.type] || file.size > MAX_IMAGE)) {
      pushToast('[!!] IMAGE INVALIDE — PNG / JPG / WEBP, 5 MO MAX', 'warning')
      return
    }
    setBusy(true)
    let path: string | null = null
    try {
      if (file) {
        path = `${agentId}/${crypto.randomUUID()}.${EXT[file.type]}`
        const { error } = await supabase.storage.from('mission-orders').upload(path, file, { contentType: file.type })
        if (error) throw error
      }
      const { error } = await supabase.from('missions').insert({
        user_id: agentId, title: title.trim(), brief: brief.trim() || null, image_path: path, created_by: user.id,
      })
      if (error) {
        if (path) await supabase.storage.from('mission-orders').remove([path])
        throw error
      }
      pushToast('[ok] ORDRE TRANSMIS', 'success')
      setTitle('')
      setBrief('')
      setFile(null)
      if (fileInput.current) fileInput.current.value = ''
      await refresh()
    } catch (error) {
      pushToast(humanizeError(error), 'danger')
    } finally {
      setBusy(false)
    }
  }

  const review = async (id: string, validate: boolean) => {
    const { error } = await supabase.rpc('review_mission', { p_mission_id: id, p_validate: validate })
    if (error) pushToast(humanizeError(error), 'danger')
    else pushToast(validate ? '[ok] MISSION VALIDÉE' : "[ok] MISSION RENVOYÉE À L'AGENT", 'success')
    await refresh()
  }

  const close = async (id: string) => {
    const { error } = await supabase.rpc('close_mission', { p_mission_id: id })
    if (error) pushToast(humanizeError(error), 'danger')
    else pushToast('[ok] MISSION CLÔTURÉE', 'success')
    await refresh()
  }

  const remove = async (id: string, imagePath: string | null) => {
    const { error } = await supabase.from('missions').delete().eq('id', id)
    if (error) {
      pushToast(humanizeError(error), 'danger')
      return
    }
    if (imagePath) await supabase.storage.from('mission-orders').remove([imagePath])
    await refresh()
  }

  const waiting = missions.filter((m) => m.status === 'awaiting_validation')
  const totalActive = missions.filter((m) => m.status === 'active').length

  return (
    <AdminLayout>
      <div className="admin-metrics metrics-three">
        <div className="metric"><small>TOTAL EN COURS</small><strong>{totalActive}</strong></div>
        <div className="metric"><small>TOTAL TERMINÉES</small><strong>{missions.length - totalActive}</strong></div>
        <div className="metric"><small>TOTAL VALIDÉES</small><strong>{missions.filter((m) => m.status === 'validated').length}</strong></div>
      </div>

      <section className="admin-panel">
        <div className="terminal-label">NOUVEL ORDRE</div>
        <form className="auth-form" onSubmit={create}>
          <label>AGENT
            <select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
              <option value="">— choisir —</option>
              {agents.map((a) => <option key={a.user_id} value={a.user_id}>{a.username}</option>)}
            </select>
          </label>
          <label>TITRE
            <input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>INSTRUCTIONS — FACULTATIF
            <textarea rows={4} maxLength={4000} value={brief} onChange={(e) => setBrief(e.target.value)} />
          </label>
          <label>IMAGE DES ORDRES — PNG / JPG / WEBP, 5 MO MAX
            <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <button className="terminal-button" disabled={busy}>{busy ? '[ ENVOI... ]' : "[ ÉMETTRE L'ORDRE ]"}</button>
        </form>
      </section>

      {isAdmin && <section className="admin-panel">
        <div className="terminal-label">À VALIDER ({waiting.length})</div>
        {waiting.length === 0 && <div className="empty-terminal">aucun rapport en attente.</div>}
        {waiting.map((m) => (
          <div key={m.id} className="mission-card">
            <div className="mission-head"><h2>{m.title}</h2><small>agent : {nameOf(m.user_id)}</small></div>
            <small>terminée le {m.completed_at ? new Date(m.completed_at).toLocaleString('fr-FR') : '—'}</small>
            <div className="review-actions">
              <button className="terminal-button success-button" onClick={() => void review(m.id, true)}>[ VALIDER ]</button>
              <button className="terminal-button danger-button" onClick={() => void review(m.id, false)}>[ RENVOYER ]</button>
            </div>
          </div>
        ))}
      </section>}

      <section className="admin-panel">
        <div className="terminal-label">COMPTEUR PAR AGENT</div>
        {agents.length === 0 && <div className="empty-terminal">aucun agent.</div>}
        {agents.length > 0 && (
          <div className="admin-table">
            <div className="admin-table-head"><span>AGENT</span><span>EN COURS</span><span>TERMINÉES</span><span>VALIDÉES</span></div>
            {agents.map((a) => {
              const own = missions.filter((m) => m.user_id === a.user_id)
              const active = own.filter((m) => m.status === 'active').length
              return (
                <div className="admin-table-row static" key={a.user_id}>
                  <span>{a.username}</span>
                  <span>{active}</span>
                  <span>{own.length - active}</span>
                  <span>{own.filter((m) => m.status === 'validated').length}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="admin-panel">
        <div className="terminal-label">TOUTES LES MISSIONS</div>
        {missions.length === 0 && <div className="empty-terminal">aucune mission émise.</div>}
        {missions.map((m) => (
          <div className="mission-card" key={m.id}>
            <div className="mission-head">
              <strong>{m.title}</strong>
              <small>{nameOf(m.user_id)} · {new Date(m.created_at).toLocaleString('fr-FR')}</small>
              <StatusBadge status={m.status} />
              {isAdmin && m.status === 'active' && <ConfirmButton className="link-button" label="CLÔTURER" confirmLabel="CONFIRMER LA CLÔTURE" onConfirm={() => void close(m.id)} />}
              {isAdmin && <ConfirmButton className="link-button" label="SUPPRIMER" confirmLabel="CONFIRMER LA SUPPRESSION" onConfirm={() => void remove(m.id, m.image_path)} />}
            </div>
            {m.brief && <p className="mission-brief">{m.brief}</p>}
            <MissionImage path={m.image_path} />
          </div>
        ))}
      </section>
    </AdminLayout>
  )
}
