import { Link, useLocation } from 'react-router-dom'
import { DataRain } from '../animations/DataRain'
import { ScanlineOverlay } from '../animations/ScanlineOverlay'
import { CRTNoise } from '../animations/CRTNoise'
import { useAuth } from '../../contexts/AuthContext'
import { NetworkPulse } from '../animations/NetworkPulse'
import { useToast } from '../ui/Toast'
import { humanizeError } from '../../lib/errors'

interface Props {
  children: React.ReactNode
  maxPhase?: number
  currentPhase?: number
  fragments?: number
  control?: boolean
}

const ROMAN = ['I', 'II', 'III', 'IV']

export function TerminalShell({ children, maxPhase = 1, currentPhase, fragments, control = false }: Props) {
  const { profile, signOut } = useAuth()
  const { pushToast } = useToast()
  const location = useLocation()
  const globalPhase = Math.min(4, Math.max(1, maxPhase))
  const displayedPhase = Math.min(4, Math.max(1, currentPhase ?? globalPhase))
  const anonymous = !profile && !control
  const integrityValue = control ? 100 : anonymous ? 0 : globalPhase >= 4 ? 14 : globalPhase === 3 ? 43 : globalPhase === 2 ? 62 : 71
  const channel = control ? 'CONTROL' : anonymous ? 'SCELLÉ' : globalPhase >= 4 ? 'INSTABLE' : 'OUVERT'
  const phaseLabel = control ? 'GM' : anonymous ? '--' : ROMAN[displayedPhase - 1]
  const relays = control ? 0 : anonymous ? 0 : globalPhase >= 4 ? 2 : globalPhase === 3 ? 5 : 7

  const closeSession = async () => {
    try {
      await signOut()
    } catch (error) {
      pushToast(humanizeError(error), 'danger')
    }
  }

  return (
    <div className={`app-shell phase-theme-${globalPhase} ${control ? 'control-theme' : ''}`}>
      <DataRain />
      <ScanlineOverlay />
      <CRTNoise />
      <header className="top-shell">
        <div className="window-chrome">
          <span className="window-dot red" /><span className="window-dot amber" /><span className="window-dot dim" />
          <span className="shell-path">{control ? 'gm@newman-archive:~/control' : 'r0@newman-archive:~/leak'}</span>
          <span className="relay">{control ? 'local · privileged' : `tor · ${relays} relais`}</span>
        </div>
        <div className="status-grid">
          <div><small>CANAL</small><strong className={anonymous ? 'warning-text' : !control && globalPhase >= 4 ? 'danger-text' : 'success-text'}>{channel}</strong></div>
          <div><small>CHIFFREMENT</small><strong>{anonymous ? 'HANDSHAKE' : !control && globalPhase >= 4 ? 'PARTIEL' : 'AES-256-GCM'}</strong></div>
          <div><small>PHASE COURANTE</small><strong>{phaseLabel}</strong></div>
          <div><small>FRAGMENTS</small><strong>{control ? '4 / 4' : anonymous ? '-- / 4' : `${fragments ?? Math.max(0, globalPhase - 1)} / 4`}</strong></div>
          <div className="integrity-cell">
            <small>INTÉGRITÉ</small>
            <strong>{integrityValue}%</strong>
            <span className="integrity-track" aria-hidden="true"><i style={{ width: `${integrityValue}%` }} /></span>
          </div>
        </div>
        <NetworkPulse severity={anonymous ? 1 : control ? 1 : globalPhase} />
        {profile && (
          <nav className="shell-nav" aria-label="navigation principale">
            <Link className={location.pathname === '/' ? 'active' : ''} to="/">ARCHIVES</Link>
            {profile.role === 'admin' && <Link className={location.pathname.startsWith('/control') ? 'active' : ''} to="/control">CONTROL</Link>}
            <span className="nav-spacer" />
            <span className="identity-label">ghost://{profile.username}</span>
            <button className="link-button" onClick={() => void closeSession()}>FERMER SESSION</button>
          </nav>
        )}
      </header>
      <main className="terminal-main">{children}</main>
    </div>
  )
}
