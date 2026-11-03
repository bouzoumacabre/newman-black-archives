import { useCallback, useEffect, useRef, useState } from 'react'
import { TerminalShell } from '../components/layout/TerminalShell'
import { He } from '../components/animations/HebrewWord'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../contexts/AuthContext'
import { usePolling } from '../hooks/usePolling'
import { supabase } from '../lib/supabase'
import { humanizeError } from '../lib/errors'
import type { ChatMessage } from '../types'

export function ChatPage() {
  const { user, profile } = useAuth()
  const { pushToast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)
  const lastId = useRef<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('id,user_id,body,created_at,profiles!messages_user_id_fkey(username)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) {
      pushToast(humanizeError(error), 'danger')
      return
    }
    setMessages(((data ?? []) as unknown as ChatMessage[]).reverse())
  }, [pushToast])

  useEffect(() => { void load() }, [load])
  usePolling(load, 4000)

  useEffect(() => {
    const newest = messages[messages.length - 1]?.id ?? null
    if (newest !== lastId.current) {
      lastId.current = newest
      bottom.current?.scrollIntoView({ block: 'end' })
    }
  }, [messages])

  const send = async (event: React.FormEvent) => {
    event.preventDefault()
    const body = text.trim()
    if (!body || !user || busy) return
    setBusy(true)
    const { error } = await supabase.from('messages').insert({ user_id: user.id, body })
    setBusy(false)
    if (error) {
      pushToast(humanizeError(error), 'danger')
      return
    }
    setText('')
    await load()
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('messages').delete().eq('id', id)
    if (error) pushToast(humanizeError(error), 'danger')
    await load()
  }

  return (
    <TerminalShell>
      <section className="r0-intro">
        <div className="terminal-kicker">CANAL COMMUN · <He>שיחה</He></div>
        <h1>Chat</h1>
      </section>
      <section className="chat-box">
        <div className="chat-log">
          {messages.length === 0 && <div className="empty-terminal">canal silencieux.</div>}
          {messages.map((m) => (
            <div key={m.id} className={`chat-line ${m.user_id === user?.id ? 'mine' : ''}`}>
              <time>{new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</time>
              <strong>{m.profiles?.username ?? m.user_id.slice(0, 8)}</strong>
              <span>{m.body}</span>
              {profile?.role === 'admin' && <button className="link-button" onClick={() => void remove(m.id)} aria-label="supprimer">×</button>}
            </div>
          ))}
          <div ref={bottom} />
        </div>
        <form className="chat-form" onSubmit={send}>
          <input value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} placeholder="> transmettre un message" autoComplete="off" />
          <button className="terminal-button" disabled={busy || !text.trim()}>[ ENVOYER ]</button>
        </form>
      </section>
    </TerminalShell>
  )
}
