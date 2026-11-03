import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { DataRain } from '../animations/DataRain'
import { ScanlineOverlay } from '../animations/ScanlineOverlay'
import { CRTNoise } from '../animations/CRTNoise'
import { HackTicker } from '../animations/HackFeed'
import { He, HebrewWord } from '../animations/HebrewWord'
import { useAuth } from '../../contexts/AuthContext'
import { NetworkPulse } from '../animations/NetworkPulse'
import { useToast } from '../ui/Toast'
import { AnnouncementBanner } from '../ui/AnnouncementBanner'
import { humanizeError } from '../../lib/errors'

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return <>{now.toISOString().slice(11, 19)} UTC</>
}

export function TerminalShell({ children, control = false }: { children: React.ReactNode; control?: boolean }) {
  const { profile, signOut } = useAuth()
  const { pushToast } = useToast()
  const location = useLocation()
  const anonymous = !profile && !control
  const isAdmin = profile?.role === 'admin'
  const isStaff = isAdmin || profile?.role === 'manager'
  const approved = profile?.status === 'approved'

  const closeSession = async () => {
    try {
      await signOut()
    } catch (error) {
      pushToast(humanizeError(error), 'danger')
    }
  }

  return (
    <div className={`app-shell phase-theme-1 ${control ? 'control-theme' : ''}`}>
      <DataRain />
      <ScanlineOverlay />
      <CRTNoise />
      <header className="top-shell">
        <div className="window-chrome">
          <span className="window-dot red" /><span className="window-dot amber" /><span className="window-dot dim" />
          <span className="shell-path">{control ? 'sn@bnw:~/control' : 'agent@bnw:~/ordres'}</span>
          <span className="relay">tor · 7 relais · <Clock /></span>
        </div>
        <div className="status-grid">
          <div><small>CANAL</small><strong className={anonymous ? 'warning-text' : 'success-text'}>{anonymous ? 'SCELLÉ' : control ? 'CONTROL' : 'OUVERT'}</strong></div>
          <div><small>CHIFFREMENT</small><strong>{anonymous ? 'HANDSHAKE' : 'AES-256-GCM'}</strong></div>
          <div><small>NŒUD</small><strong>BNW-VLT-1924</strong></div>
          <div><small>SIGNAL</small><strong><HebrewWord /></strong></div>
          <div><small>TRACE</small><strong className="danger-text blink-slow">MASQUÉE</strong></div>
        </div>
        <NetworkPulse severity={1} />
        <HackTicker />
        {profile && (
          <nav className="shell-nav" aria-label="navigation principale">
            {approved && <Link className={location.pathname === '/' ? 'active' : ''} to="/">ORDRES <He>פקודות</He></Link>}
            {approved && <Link className={location.pathname === '/chat' ? 'active' : ''} to="/chat">CHAT <He>שיחה</He></Link>}
            {approved && isStaff && (
              <Link className={location.pathname.startsWith('/control') ? 'active' : ''} to={isAdmin ? '/control' : '/control/missions'}>CONTROL <He>שליטה</He></Link>
            )}
            <span className="nav-spacer" />
            <span className="identity-label">agent://{profile.username}</span>
            <button className="link-button" onClick={() => void closeSession()}>FERMER SESSION</button>
          </nav>
        )}
      </header>
      {approved && <AnnouncementBanner />}
      <main className="terminal-main">{children}</main>
    </div>
  )
}
