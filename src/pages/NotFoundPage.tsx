import { Link } from 'react-router-dom'
import { TerminalShell } from '../components/layout/TerminalShell'

export function NotFoundPage() {
  return <TerminalShell><section className="not-found"><h1>SIGNAL LOST</h1><p>NODE NOT FOUND</p><p>r0&gt; <span className="cursor">_</span></p><Link className="terminal-button" to="/">[ REVENIR AU CANAL ]</Link></section></TerminalShell>
}
