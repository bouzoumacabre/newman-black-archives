import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { TerminalShell } from '../components/layout/TerminalShell'
import { useAuth } from '../contexts/AuthContext'
import { humanizeError } from '../lib/errors'
import { isValidUsername, normalizeUsername } from '../lib/auth'
import { useToast } from '../components/ui/Toast'

export function AuthPage() {
  const { user, signIn, signUp, configured } = useAuth()
  const { pushToast } = useToast()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!configured) {
      pushToast('CONFIGURATION SUPABASE REQUISE — VOIR README.md', 'danger')
      return
    }
    const clean = normalizeUsername(username)
    if (!isValidUsername(clean)) {
      pushToast('ALIAS INVALIDE — 3 À 24 CARACTÈRES : a-z 0-9 _ - .', 'warning')
      return
    }
    if (password.length < 8) {
      pushToast("CLÉ D'ACCÈS TROP COURTE — 8 CARACTÈRES MINIMUM", 'warning')
      return
    }
    if (mode === 'signup' && password !== confirm) {
      pushToast("LES CLÉS D'ACCÈS NE CORRESPONDENT PAS", 'warning')
      return
    }
    setBusy(true)
    try {
      if (mode === 'signup') {
        const sessionOpened = await signUp(clean, password)
        if (sessionOpened) pushToast('[ok] IDENTITÉ FANTÔME INITIALISÉE', 'success')
        else pushToast('[!!] IDENTITÉ CRÉÉE MAIS SESSION BLOQUÉE — DÉSACTIVEZ LA CONFIRMATION EMAIL DANS SUPABASE', 'warning')
      } else {
        await signIn(clean, password)
        pushToast('[ok] SESSION ÉTABLIE', 'success')
      }
    } catch (error) {
      pushToast(humanizeError(error), 'danger')
    } finally {
      setBusy(false)
    }
  }

  return (
    <TerminalShell>
      <section className="auth-wrap">
        <div className="terminal-kicker">BNW // BLACK ARCHIVES // AUTHENTICATION NODE</div>
        <h1>NEWMAN BLACK ARCHIVES</h1>
        <div className="auth-status">
          <p>Aucune identité reconnue.</p>
          <p>&gt; {mode === 'signup' ? 'INIT GHOST' : 'AUTH GHOST'}</p>
        </div>
        {!configured && <div className="system-warning">[!!] SUPABASE NON CONFIGURÉ — renseignez .env avant utilisation réelle.</div>}
        <form className="auth-form" onSubmit={submit}>
          <label>ALIAS
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="identité" />
          </label>
          <label>CLÉ D'ACCÈS
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="••••••••••••" />
          </label>
          {mode === 'signup' && <label>CONFIRMER CLÉ
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" placeholder="••••••••••••" />
          </label>}
          <button className="terminal-button auth-submit" disabled={busy}>
            {busy ? '[ ÉTABLISSEMENT DU TUNNEL... ]' : mode === 'signup' ? '[ INITIALISER IDENTITÉ FANTÔME ]' : '[ OUVRIR SESSION ]'}
          </button>
        </form>
        <button className="link-button auth-switch" onClick={() => setMode((m) => m === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? '> AUCUNE IDENTITÉ ? INITIALISER UNE EMPREINTE' : '> IDENTITÉ EXISTANTE ? OUVRIR LE CANAL'}
        </button>
        {mode === 'signup' && <div className="r0-auth-note">VOUS N'ÊTES PAS AUTORISÉ À ÊTRE ICI.<br />MAIS QUELQU'UN A LAISSÉ LA PORTE OUVERTE.<br /><span>— R-0</span></div>}
      </section>
    </TerminalShell>
  )
}
