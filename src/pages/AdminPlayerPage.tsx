import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AdminLayout } from '../components/admin/AdminLayout'
import { PHASES } from '../content/phases'
import type { ActivityEvent, OperatorMessage, PlayerProgress, Profile, Submission, Transmission } from '../types'
import { useToast } from '../components/ui/Toast'
import { humanizeError } from '../lib/errors'
import { usePolling } from '../hooks/usePolling'
import { HEBREW_FRAGMENTS } from '../content/hebrew'

export function AdminPlayerPage() {
  const { id } = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [progress, setProgress] = useState<PlayerProgress[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [transmissions, setTransmissions] = useState<Transmission[]>([])
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [operatorMessages, setOperatorMessages] = useState<OperatorMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [unlocking, setUnlocking] = useState<number | null>(null)
  const [messageBody, setMessageBody] = useState('')
  const [messagePhase, setMessagePhase] = useState<string>('global')
  const [sendingMessage, setSendingMessage] = useState(false)
  const { pushToast } = useToast()

  const load = useCallback(async () => {
    if (!id) return
    try {
      const [p, pr, s, t, e, m] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', id).maybeSingle(),
        supabase.from('player_progress').select('*').eq('user_id', id).order('phase_no'),
        supabase.from('submissions').select('*').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('transmissions').select('*').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('activity_events').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(30),
        supabase.from('operator_messages').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(20),
      ])
      const error = p.error || pr.error || s.error || t.error || e.error || m.error
      if (error) throw error
      setProfile(p.data as Profile | null)
      setProgress((pr.data ?? []) as PlayerProgress[])
      setSubmissions((s.data ?? []) as Submission[])
      setTransmissions((t.data ?? []) as Transmission[])
      setEvents((e.data ?? []) as ActivityEvent[])
      setOperatorMessages((m.data ?? []) as OperatorMessage[])
    } catch (error) {
      pushToast(humanizeError(error), 'danger')
    } finally {
      setLoading(false)
    }
  }, [id, pushToast])

  useEffect(() => { void load() }, [load])
  usePolling(load, 8000, Boolean(id))

  const unlockedSet = useMemo(() => new Set(progress.map((row) => row.phase_no)), [progress])

  const sendOperatorMessage = async () => {
    if (!id || sendingMessage) return
    const body = messageBody.trim()
    if (!body) {
      pushToast('[!!] MESSAGE R-0 VIDE', 'warning')
      return
    }
    setSendingMessage(true)
    try {
      const { error } = await supabase.rpc('send_operator_message', {
        p_user_id: id,
        p_body: body,
        p_phase_no: messagePhase === 'global' ? null : Number(messagePhase),
      })
      if (error) throw error
      pushToast('[ok] MESSAGE R-0 TRANSMIS', 'success')
      setMessageBody('')
      await load()
    } catch (error) {
      pushToast(humanizeError(error), 'danger')
    } finally {
      setSendingMessage(false)
    }
  }

  const unlock = async (phaseNo: number) => {
    if (!id || unlocking) return
    const phase = PHASES.find((item) => item.no === phaseNo)
    if (!phase || !window.confirm(`OUVRIR LE CANAL ${phase.sector} POUR CETTE IDENTITÉ ?`)) return

    setUnlocking(phaseNo)
    try {
      const { error } = await supabase.rpc('unlock_phase', { p_user_id: id, p_phase_no: phaseNo })
      if (error) throw error
      pushToast(`[ok] SECTEUR ${phase.sector} OUVERT`, 'success')
      await load()
    } catch (error) {
      pushToast(humanizeError(error), 'danger')
    } finally {
      setUnlocking(null)
    }
  }

  if (loading) {
    return <AdminLayout><section className="admin-panel"><div className="empty-terminal">montage du profil fantôme...</div></section></AdminLayout>
  }

  if (!profile) {
    return <AdminLayout><section className="admin-panel"><div className="danger-text">IDENTITÉ INTROUVABLE</div></section></AdminLayout>
  }

  return (
    <AdminLayout>
      <section className="admin-panel">
        <div className="admin-panel-title-row">
          <div>
            <div className="terminal-label">GHOST PROFILE</div>
            <h2 className="admin-player-name">{profile.username}</h2>
          </div>
          <div className="admin-profile-meta">
            <span>ROLE // {profile.role.toUpperCase()}</span>
            <span>CREATED // {new Date(profile.created_at).toLocaleString('fr-FR')}</span>
          </div>
        </div>

        <div className="admin-phase-grid">
          {PHASES.map((phase) => {
            const row = progress.find((item) => item.phase_no === phase.no)
            const previous = phase.no <= 1 ? null : progress.find((item) => item.phase_no === phase.no - 1)
            const canUnlock = !row && (phase.no === 1 || Boolean(previous?.completed_at))
            return (
              <div key={phase.no} className={`admin-phase-card ${row?.completed_at ? 'cleared' : row ? 'unlocked' : 'locked'}`}>
                <span>{phase.code} // {phase.sector}</span>
                <strong>{phase.name}</strong>
                <small>{row ? row.completed_at ? 'CLEARED' : 'UNLOCKED' : 'LOCKED'}</small>
                {!row && (
                  <button
                    className="terminal-button"
                    disabled={!canUnlock || unlocking !== null}
                    onClick={() => void unlock(phase.no)}
                    title={!canUnlock ? 'La phase précédente doit être validée avant ouverture.' : undefined}
                  >
                    {unlocking === phase.no ? '[ OUVERTURE... ]' : canUnlock ? '[ DÉBLOQUER ]' : '[ PRÉREQUIS MANQUANT ]'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="admin-panel operator-compose">
        <div className="terminal-label">R-0 OPERATOR CHANNEL</div>
        <p className="admin-help">Envoyer un indice ou un message RP directement à cette identité. Le texte n'est pas préchargé dans le frontend et peut contenir ponctuellement un fragment hébreu. Ne pas utiliser ce canal pour les coordonnées GPS : elles passent uniquement par la validation d'analyse.</p>
        {operatorMessages.length > 0 && (
          <div className="operator-message-history">
            {operatorMessages.slice(0, 6).map((item) => (
              <div key={item.id}>
                <span>{item.phase_no ? `PH-${item.phase_no}` : 'GLOBAL'} · {new Date(item.created_at).toLocaleString('fr-FR')}</span>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        )}
        <div className="hebrew-quick-insert" aria-label="fragments hébreux rapides">
          {HEBREW_FRAGMENTS.map((fragment) => (
            <button
              key={fragment.hebrew}
              type="button"
              title={`${fragment.latin} — ${fragment.meaning}`}
              onClick={() => setMessageBody((current) => `${current}${current && !current.endsWith(' ') ? ' ' : ''}${fragment.hebrew}`.slice(0, 2000))}
            >
              <span dir="rtl" lang="he">{fragment.hebrew}</span>
              <small>{fragment.latin}</small>
            </button>
          ))}
        </div>
        <div className="operator-compose-grid">
          <label>PORTÉE
            <select value={messagePhase} onChange={(event) => setMessagePhase(event.target.value)}>
              <option value="global">GLOBAL</option>
              {PHASES.filter((phase) => unlockedSet.has(phase.no)).map((phase) => <option key={phase.no} value={phase.no}>PH-{phase.no} // {phase.name}</option>)}
            </select>
          </label>
          <label>MESSAGE R-0
            <textarea rows={5} maxLength={2000} value={messageBody} onChange={(event) => setMessageBody(event.target.value)} placeholder="Ex. La porte n'est pas là où vous regardez. אמת" />
          </label>
        </div>
        <div className="operator-compose-footer">
          <span>{messageBody.length}/2000</span>
          <button className="terminal-button" disabled={sendingMessage || !messageBody.trim()} onClick={() => void sendOperatorMessage()}>
            {sendingMessage ? '[ TRANSMISSION... ]' : '[ ENVOYER SUR LE CANAL R-0 ]'}
          </button>
        </div>
      </section>

      <section className="admin-panel">
        <div className="terminal-label">SUBMISSION HISTORY</div>
        {submissions.length === 0 && <div className="empty-terminal">aucune analyse.</div>}
        {submissions.map((submission) => (
          <div className="compact-row" key={submission.id}>
            <span>PH-{submission.phase_no}</span>
            <span>{submission.status.toUpperCase()}</span>
            <time>{new Date(submission.created_at).toLocaleString('fr-FR')}</time>
          </div>
        ))}
      </section>

      <section className="admin-panel">
        <div className="terminal-label">TRANSMISSIONS</div>
        {transmissions.length === 0 && <div className="empty-terminal">aucune coordonnée transmise.</div>}
        {transmissions.map((transmission) => (
          <div className="compact-row" key={transmission.id}>
            <span>PH-{transmission.phase_no}</span>
            <span className="coordinates-cell">{transmission.coordinates}</span>
            <time>{new Date(transmission.created_at).toLocaleString('fr-FR')}</time>
          </div>
        ))}
      </section>

      <section className="admin-panel">
        <div className="terminal-label">ACTIVITY TRACE</div>
        {events.length === 0 && <div className="empty-terminal">aucun événement.</div>}
        <div className="admin-log compact-activity">
          {events.map((event) => (
            <div key={event.id}>
              <time>{new Date(event.created_at).toLocaleString('fr-FR')}</time>
              <span>{event.label}</span>
              <small>{event.event_type}</small>
            </div>
          ))}
        </div>
      </section>
    </AdminLayout>
  )
}
