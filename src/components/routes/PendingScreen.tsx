import { TerminalShell } from '../layout/TerminalShell'
import { useAuth } from '../../contexts/AuthContext'
import { usePolling } from '../../hooks/usePolling'
import { TypingText } from '../animations/TypingText'
import { He } from '../animations/HebrewWord'

export function PendingScreen() {
  const { profile, refreshProfile, signOut } = useAuth()
  usePolling(() => { void refreshProfile() }, 6000)
  const rejected = profile?.status === 'rejected'

  return (
    <TerminalShell>
      <section className="auth-wrap">
        <div className="terminal-kicker">NOEUD D'AUTHENTIFICATION · <He>{rejected ? 'נדחה' : 'ממתין'}</He></div>
        <h1>{rejected ? 'ACCÈS REFUSÉ' : 'EN ATTENTE'}</h1>
        <div className="auth-status">
          <p><TypingText text={rejected ? "Votre demande n'a pas été retenue." : 'Demande transmise. Un administrateur doit valider votre identité.'} cursor /></p>
          <p>&gt; ghost://{profile?.username}</p>
        </div>
        {!rejected && <p className="empty-terminal">cette page se met à jour automatiquement.</p>}
        <button className="link-button" onClick={() => void signOut()}>FERMER SESSION</button>
      </section>
    </TerminalShell>
  )
}
