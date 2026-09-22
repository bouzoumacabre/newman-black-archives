import { NavLink } from 'react-router-dom'
import { TerminalShell } from '../layout/TerminalShell'

const navClass = ({ isActive }: { isActive: boolean }) => isActive ? 'active' : undefined

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <TerminalShell maxPhase={1} currentPhase={1} fragments={4} control>
      <section className="admin-shell">
        <header className="admin-header">
          <div className="terminal-kicker">NEWMAN ARCHIVE CONTROL SYSTEM</div>
          <h1>TREASURE PROTOCOL</h1>
          <p>GAME MASTER CLEARANCE</p>
        </header>
        <nav className="admin-nav" aria-label="navigation Game Master">
          <NavLink end to="/control" className={navClass}>OVERVIEW</NavLink>
          <NavLink to="/control/submissions" className={navClass}>SUBMISSIONS</NavLink>
          <NavLink to="/control/players" className={navClass}>PLAYERS</NavLink>
          <NavLink to="/control/transmissions" className={navClass}>TRANSMISSIONS</NavLink>
        </nav>
        {children}
      </section>
    </TerminalShell>
  )
}
