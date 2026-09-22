import { useEffect, useState } from 'react'
import { getPhase } from '../../content/phases'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { DecryptText } from './DecryptText'

export function PhaseUnlockNotice({ phaseNo }: { phaseNo: number }) {
  const reduced = useReducedMotion()
  const [visible, setVisible] = useState(false)
  const phase = getPhase(phaseNo)

  useEffect(() => {
    if (!phase || phaseNo <= 1) return
    const key = `nba_phase_unlock_seen_${phaseNo}`
    if (sessionStorage.getItem(key) === '1') return

    sessionStorage.setItem(key, '1')
    setVisible(true)

    if (reduced) {
      const timer = window.setTimeout(() => setVisible(false), 1700)
      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => setVisible(false), 4300)
    return () => window.clearTimeout(timer)
  }, [phase, phaseNo, reduced])

  if (!visible || !phase) return null

  return (
    <div className="phase-unlock-overlay" role="status" aria-live="polite">
      <div className="phase-unlock-box">
        <div className="terminal-label">[ok] AUTORISATION R-0 REÇUE</div>
        <strong><DecryptText text={`SECTEUR ${phase.sector} OUVERT`} duration={reduced ? 1 : 1000} /></strong>
        <span>{phase.code} // {phase.name}</span>
        <div className="phase-unlock-progress" aria-hidden="true"><i /></div>
      </div>
    </div>
  )
}
