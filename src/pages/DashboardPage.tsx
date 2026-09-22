import { PHASES } from '../content/phases'
import { R0_INTRO } from '../content/systemLogs'
import { PhaseCard } from '../components/phases/PhaseCard'
import { SystemLogFeed } from '../components/phases/SystemLogFeed'
import { TerminalShell } from '../components/layout/TerminalShell'
import { LoadingTerminal } from '../components/ui/LoadingTerminal'
import { usePlayerData } from '../hooks/usePlayerData'
import { R0CommandPrompt } from '../components/terminal/R0CommandPrompt'
import { PhaseUnlockNotice } from '../components/animations/PhaseUnlockNotice'
import { R0Inbox } from '../components/phases/R0Inbox'
import { IncomingTransmissionAlert } from '../components/phases/IncomingTransmissionAlert'

export function DashboardPage() {
  const { progress, submissions, transmissions, events, messages, loading, error, maxPhase } = usePlayerData()
  if (loading) return <TerminalShell><LoadingTerminal /></TerminalShell>

  return (
    <TerminalShell maxPhase={maxPhase} currentPhase={maxPhase} fragments={progress.filter((row) => row.completed_at).length}>
      <PhaseUnlockNotice phaseNo={maxPhase} />
      <IncomingTransmissionAlert transmissions={transmissions} />
      <section className="command-log">
        <div>$ ./r0 --leak newman_archive</div>
        <div>[ok] montage de l'archive .............. 50 documents</div>
        <div>[ok] vérification des empreintes ....... intactes</div>
        <div>[ok] canal sortant ..................... chiffré</div>
        <div>[!!] trace entrante détectée ........... source masquée</div>
        {error && <div className="danger-text">[xx] sync error ........................ {error}</div>}
        <div>$ <span className="cursor">_</span></div>
      </section>

      <section className="r0-intro">
        <div className="terminal-kicker">LE TRÉSOR DES NEWMAN · CANAL R-0</div>
        <h1>Terminal R-0</h1>
        <div className="r0-copy">
          {R0_INTRO.map((text) => <p key={text}>{text}</p>)}
          <strong>— R-0</strong>
        </div>
      </section>

      <SystemLogFeed phaseNo={maxPhase} />
      <R0Inbox messages={messages.filter((message) => message.phase_no == null || message.phase_no <= maxPhase)} limit={3} />

      <div className="phase-list">
        {PHASES.map((phase) => {
          const p = progress.find((row) => row.phase_no === phase.no)
          const submission = submissions.find((row) => row.phase_no === phase.no)
          return <PhaseCard key={phase.no} phase={phase} progress={p} submission={submission} />
        })}
      </div>

      <section className="activity-section">
        <div className="terminal-kicker">SESSION ACTIVITY</div>
        {events.length === 0 ? <p>aucun événement récupéré.</p> : (
          <div className="activity-log">
            {events.slice(0, 12).map((event) => (
              <div key={event.id}><time>{new Date(event.created_at).toLocaleString('fr-FR')}</time><span>{event.label}</span></div>
            ))}
          </div>
        )}
      </section>

      <R0CommandPrompt maxPhase={maxPhase} />
    </TerminalShell>
  )
}
