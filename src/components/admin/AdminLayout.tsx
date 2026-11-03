import { NavLink } from 'react-router-dom'
import { TerminalShell } from '../layout/TerminalShell'
import { GlitchText } from '../animations/GlitchText'
import { He } from '../animations/HebrewWord'
import { useAuth } from '../../contexts/AuthContext'

const navClass = ({ isActive }: { isActive: boolean }) => isActive ? 'active' : undefined

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  return (
    <TerminalShell control>
      <section className="admin-shell">
        <header className="admin-header">
          <div className="terminal-kicker">RÉSEAU PRIVÉ · CONTROL · <He>שליטה</He></div>
          <h1><GlitchText>ORDRES DE MISSION</GlitchText></h1>
          <p>{isAdmin ? 'SN CLEARANCE' : 'ÉQUIPE'}</p>
        </header>
        <nav className="admin-nav" aria-label="navigation SN">
          {isAdmin && <NavLink end to="/control" className={navClass}>OVERVIEW</NavLink>}
          <NavLink to="/control/missions" className={navClass}>MISSIONS</NavLink>
          {isAdmin && <NavLink to="/control/accounts" className={navClass}>INSCRIPTIONS</NavLink>}
        </nav>
        {children}
      </section>
    </TerminalShell>
  )
}
