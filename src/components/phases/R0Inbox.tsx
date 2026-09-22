import { useEffect, useMemo, useState } from 'react'
import type { OperatorMessage } from '../../types'
import { DecryptText } from '../animations/DecryptText'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export function R0Inbox({ messages, phaseNo, limit = 4 }: { messages: OperatorMessage[]; phaseNo?: number; limit?: number }) {
  const reduced = useReducedMotion()
  const visible = useMemo(() => messages
    .filter((message) => phaseNo == null || message.phase_no == null || message.phase_no === phaseNo)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit), [messages, phaseNo, limit])

  const newestId = visible[0]?.id
  const [incomingId, setIncomingId] = useState<string | null>(null)

  useEffect(() => {
    if (!newestId) return
    const key = `nba_r0_message_seen_${newestId}`
    if (sessionStorage.getItem(key) === '1') return

    sessionStorage.setItem(key, '1')
    setIncomingId(newestId)
    const timer = window.setTimeout(() => setIncomingId(null), reduced ? 1200 : 4800)
    return () => window.clearTimeout(timer)
  }, [newestId, reduced])

  if (visible.length === 0) return null

  return (
    <section className={`r0-inbox ${incomingId ? 'has-incoming' : ''}`} aria-label="messages R-0" aria-live="polite">
      <div className="terminal-label">
        {incomingId ? <DecryptText text="[!!] INCOMING MESSAGE // R-0" duration={reduced ? 1 : 800} /> : 'CANAL R-0 // MESSAGES'}
      </div>
      {visible.map((message) => (
        <article key={message.id} className={`r0-inbox-message ${message.id === incomingId ? 'incoming' : ''}`}>
          <div className="r0-inbox-meta">
            <span>{message.id === incomingId ? 'LIVE PACKET' : 'ARCHIVED'}</span>
            <time>{new Date(message.created_at).toLocaleString('fr-FR')}</time>
            {message.phase_no && <span>PH-{message.phase_no}</span>}
          </div>
          <p>{message.body}</p>
          <strong>— R-0</strong>
        </article>
      ))}
    </section>
  )
}
