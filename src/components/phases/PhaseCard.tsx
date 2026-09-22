import { Link } from 'react-router-dom'
import type { PhaseDefinition, PlayerProgress, Submission } from '../../types'
import { StatusBadge } from '../ui/StatusBadge'
import { GlitchText } from '../animations/GlitchText'

export function PhaseCard({ phase, progress, submission }: { phase: PhaseDefinition; progress?: PlayerProgress; submission?: Submission }) {
  const unlocked = Boolean(progress)
  const completed = Boolean(progress?.completed_at)
  const status = !unlocked
    ? 'ACCESS DENIED'
    : completed
      ? 'CLEARED'
      : submission?.status === 'pending'
        ? 'PENDING'
        : submission?.status === 'revision_requested'
          ? 'REVISION REQUIRED'
          : submission?.status === 'rejected'
            ? 'RETRY'
            : 'ACTIVE'
  const revealName = unlocked || phase.no === 1

  return (
    <section className={`phase-card phase-card-${phase.no} ${!unlocked ? 'locked' : ''}`}>
      <div className="phase-card-header">
        <span className="phase-code">{phase.code}</span>
        <div className="phase-title-group">
          <h2>{revealName ? (phase.no === 4 ? <GlitchText>{phase.name}</GlitchText> : phase.name) : '████████████'}</h2>
          <p>{revealName ? `Documents ${phase.documents} — « ${phase.subtitle} »` : 'Fragment scellé. Autorisation R-0 requise.'}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      {unlocked ? (
        <div className="phase-card-body">
          <span>SECTEUR {phase.sector}</span>
          <Link className="terminal-button" to={`/phase/${phase.no}`}>[ OUVRIR ARCHIVE ]</Link>
        </div>
      ) : (
        <div className="locked-line">[verrouillé] canal scellé. Terminez les opérations précédentes et attendez l'autorisation R-0.</div>
      )}
    </section>
  )
}
