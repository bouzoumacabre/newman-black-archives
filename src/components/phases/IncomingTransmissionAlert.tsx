import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Transmission } from '../../types'
import { DecryptText } from '../animations/DecryptText'

export function IncomingTransmissionAlert({ transmissions }: { transmissions: Transmission[] }) {
  const latest = [...transmissions].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!latest) {
      setVisible(false)
      return
    }
    const alertKey = `nba_tx_alert_seen_${latest.id}`
    const revealKey = `nba_transmission_seen_${latest.id}`
    setVisible(sessionStorage.getItem(alertKey) !== '1' && sessionStorage.getItem(revealKey) !== '1')
  }, [latest?.id])

  if (!latest || !visible) return null

  const acknowledge = () => {
    sessionStorage.setItem(`nba_tx_alert_seen_${latest.id}`, '1')
    setVisible(false)
  }

  return (
    <section className="incoming-transmission-alert" role="status" aria-live="polite">
      <div>
        <span>[!!] PAQUET R-0 EN ATTENTE</span>
        <strong><DecryptText text={`FRAGMENT ${latest.phase_no} // TRANSMISSION DISPONIBLE`} duration={850} /></strong>
      </div>
      <Link className="terminal-button" to={`/phase/${latest.phase_no}`} onClick={acknowledge}>[ OUVRIR LE PAQUET ]</Link>
      <button className="incoming-dismiss" onClick={acknowledge} aria-label="masquer la notification">×</button>
    </section>
  )
}
