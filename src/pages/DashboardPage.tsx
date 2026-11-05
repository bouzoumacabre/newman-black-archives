import { useState } from 'react'
import { ConfidentialStamp, HackFeed } from '../components/animations/HackFeed'
import { GlitchText } from '../components/animations/GlitchText'
import { He } from '../components/animations/HebrewWord'
import { TerminalShell } from '../components/layout/TerminalShell'
import { LoadingTerminal } from '../components/ui/LoadingTerminal'
import { ConfirmButton } from '../components/ui/ConfirmButton'
import { StatusBadge } from '../components/ui/StatusBadge'
import { MissionImage } from '../components/ui/MissionImage'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../contexts/AuthContext'
import { useMissions } from '../hooks/useMissions'
import { supabase } from '../lib/supabase'
import { humanizeError } from '../lib/errors'
import type { Mission } from '../types'

export function DashboardPage() {
  const { user } = useAuth()
  const { missions, loading, error, refresh } = useMissions()
  const { pushToast } = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)

  if (loading) return <TerminalShell><LoadingTerminal /></TerminalShell>

  const complete = async (mission: Mission) => {
    if (busyId) return
    setBusyId(mission.id)
    try {
      const { error: err } = await supabase.rpc('complete_mission', { p_mission_id: mission.id })
      if (err) throw err
      pushToast('[ok] MISSION DÉCLARÉE TERMINÉE — EN ATTENTE DE VALIDATION', 'success')
      await refresh()
    } catch (err) {
      pushToast(humanizeError(err), 'danger')
    } finally {
      setBusyId(null)
    }
  }

  // Staff can read every mission through RLS: this page only shows the viewer's own.
  const mine = missions.filter((m) => m.user_id === user?.id)
  const open = mine.filter((m) => m.status !== 'validated')
  const done = mine.filter((m) => m.status === 'validated')
  const active = mine.filter((m) => m.status === 'active').length

  return (
    <TerminalShell>
      <section className="command-log">
        <div>$ ./sn --ordres</div>
        <div>[ok] canal sécurisé ................ établi</div>
        <div>[ok] ordres en cours ............... {open.length}</div>
        {error && <div className="danger-text">[xx] sync error ........................ {error}</div>}
        <div>$ <span className="cursor">_</span></div>
      </section>

      <section className="r0-intro">
        <ConfidentialStamp />
        <div className="terminal-kicker">CANAL SN · <He>פקודות</He></div>
        <h1><GlitchText>Ordres de mission</GlitchText></h1>
      </section>
      <div className="admin-metrics metrics-four metrics-spaced">
        <div className="metric"><small>EN COURS</small><strong>{active}</strong></div>
        <div className="metric"><small>TERMINÉES</small><strong>{mine.length - active}</strong></div>
      </div>
      <HackFeed lines={6} />

      {open.length === 0 && <div className="empty-terminal">aucun ordre en attente. restez joignable.</div>}
      {open.map((mission) => (
        <section key={mission.id} className="mission-card">
          <div className="mission-head">
            <h2>{mission.title}</h2>
            <StatusBadge status={mission.status} />
          </div>
          <small>émis le {new Date(mission.created_at).toLocaleString('fr-FR')}</small>
          {mission.brief && <p className="mission-brief">{mission.brief}</p>}
          <MissionImage path={mission.image_path} />
          {mission.status === 'active' ? (
            <ConfirmButton
              className="terminal-button"
              disabled={busyId === mission.id}
              label={busyId === mission.id ? '[ TRANSMISSION... ]' : '[ MARQUER TERMINÉ ]'}
              confirmLabel="[ CONFIRMER : MISSION TERMINÉE ]"
              onConfirm={() => void complete(mission)}
            />
          ) : (
            <div className="locked-line">[en attente] SN examine votre rapport.</div>
          )}
        </section>
      ))}

      {done.length > 0 && (
        <section className="activity-section">
          <div className="terminal-kicker">MISSIONS CLÔTURÉES</div>
          <div className="activity-log">
            {done.map((m) => (
              <div key={m.id}><time>{new Date(m.validated_at ?? m.created_at).toLocaleString('fr-FR')}</time><span>{m.title}</span></div>
            ))}
          </div>
        </section>
      )}
    </TerminalShell>
  )
}
