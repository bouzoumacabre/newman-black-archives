import { useEffect, useMemo, useState } from 'react'
import { DecryptText } from './DecryptText'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { copyText } from '../../lib/clipboard'
import { useToast } from '../ui/Toast'

interface Props {
  transmissionId: string
  phaseNo: number
  coordinates: string
  message?: string | null
}

export function TransmissionReveal({ transmissionId, phaseNo, coordinates, message }: Props) {
  const reduced = useReducedMotion()
  const { pushToast } = useToast()
  const storageKey = useMemo(() => `nba_transmission_seen_${transmissionId}`, [transmissionId])
  const alreadySeen = sessionStorage.getItem(storageKey) === '1'
  const [stage, setStage] = useState(reduced || alreadySeen ? 4 : 0)

  useEffect(() => {
    if (reduced || alreadySeen) {
      sessionStorage.setItem(storageKey, '1')
      setStage(4)
      return
    }

    const timers = [
      window.setTimeout(() => setStage(1), 450),
      window.setTimeout(() => setStage(2), 1050),
      window.setTimeout(() => setStage(3), 1700),
      window.setTimeout(() => {
        setStage(4)
        sessionStorage.setItem(storageKey, '1')
      }, 2350),
    ]
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [alreadySeen, reduced, storageKey])

  const copyCoordinates = async () => {
    const copied = await copyText(coordinates)
    pushToast(copied ? '[ok] COORDONNÉES COPIÉES' : '[xx] COPIE IMPOSSIBLE — SÉLECTION MANUELLE REQUISE', copied ? 'success' : 'warning')
  }

  return (
    <div className="transmission-reveal" aria-live="polite">
      {!alreadySeen && <p>[!!] paquet entrant</p>}
      {alreadySeen && <p className="transmission-archive-line">[ok] paquet archivé // fragment {phaseNo}</p>}
      {stage >= 1 && !alreadySeen && <p>origine ................. masquée<br />signature ............... valide<br />fragment ................ {phaseNo}</p>}
      {stage >= 2 && !alreadySeen && <p>déchiffrement en cours...<br /><span className="progress-bar">████████████████████</span> 100%</p>}
      {stage >= 3 && !alreadySeen && <h3><DecryptText text="TRANSMISSION RECOVERED" /></h3>}
      {stage >= 4 && (
        <div className="coordinates-box">
          <span>COORDONNÉES RÉCUPÉRÉES</span>
          <strong>{coordinates}</strong>
          {message && <p className="r0-message">{message}<br /><span>— R-0</span></p>}
          <button className="terminal-button" onClick={() => void copyCoordinates()}>[ COPIER LES COORDONNÉES ]</button>
        </div>
      )}
    </div>
  )
}
