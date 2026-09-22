import { Navigate, useParams } from 'react-router-dom'
import { TerminalShell } from '../components/layout/TerminalShell'
import { LoadingTerminal } from '../components/ui/LoadingTerminal'
import { SubmissionTerminal } from '../components/phases/SubmissionTerminal'
import { TransmissionPanel } from '../components/phases/TransmissionPanel'
import { SystemLogFeed } from '../components/phases/SystemLogFeed'
import { getPhase } from '../content/phases'
import { usePlayerData } from '../hooks/usePlayerData'
import { GlitchText } from '../components/animations/GlitchText'
import { R0Inbox } from '../components/phases/R0Inbox'
import { PhaseCipherStamp } from '../components/phases/PhaseCipherStamp'

export function PhasePage() {
  const params = useParams()
  const no = Number(params.no)
  const phase = getPhase(no)
  const data = usePlayerData()
  if (!phase) return <Navigate to="/" replace />
  if (data.loading) return <TerminalShell><LoadingTerminal /></TerminalShell>
  const unlocked = data.progress.some((row) => row.phase_no === no)
  if (!unlocked) return <Navigate to="/" replace />

  return (
    <TerminalShell maxPhase={data.maxPhase} currentPhase={no} fragments={data.progress.filter((row) => row.completed_at).length}>
      <section className={`phase-page phase-page-${no}`}>
        <div className="phase-heading">
          <span>{phase.code} // SECTEUR {phase.sector}</span>
          <h1>{no === 4 ? <GlitchText children={phase.name} /> : phase.name}</h1>
          <p>Documents {phase.documents} — « {phase.subtitle} »</p>
          <PhaseCipherStamp phaseNo={no} />
        </div>
        <SystemLogFeed phaseNo={no} />
        <R0Inbox messages={data.messages} phaseNo={no} limit={5} />
        <SubmissionTerminal phaseNo={no} submissions={data.submissions} onSubmitted={data.refresh} />
        <TransmissionPanel phaseNo={no} transmissions={data.transmissions} />
        <section className="phase-history">
          <div className="terminal-label">HISTORIQUE DU FRAGMENT</div>
          {data.submissions.filter(s => s.phase_no === no).map((submission, idx) => (
            <div className="history-row" key={submission.id}>
              <span>#{data.submissions.filter(s => s.phase_no === no).length - idx}</span>
              <span>{new Date(submission.created_at).toLocaleString('fr-FR')}</span>
              <strong>{submission.status.toUpperCase()}</strong>
            </div>
          ))}
        </section>
      </section>
    </TerminalShell>
  )
}
