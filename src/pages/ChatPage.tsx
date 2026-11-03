import { useCallback, useEffect, useRef, useState } from 'react'
import { TerminalShell } from '../components/layout/TerminalShell'
import { He } from '../components/animations/HebrewWord'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../contexts/AuthContext'
import { usePolling } from '../hooks/usePolling'
import { supabase } from '../lib/supabase'
import { humanizeError } from '../lib/errors'
import type { ChatMessage } from '../types'

interface Member { user_id: string; username: string }

export function ChatPage() {
  const { user, profile } = useAuth()
  const { pushToast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [text, setText] = useState('')
  const [recipient, setRecipient] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [busy, setBusy] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)
  const lastId = useRef<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('chat_feed')
    if (error) {
      pushToast(humanizeError(error), 'danger')
      return
    }
    setMessages(((data ?? []) as ChatMessage[]).slice().reverse())
  }, [pushToast])

  useEffect(() => { void load() }, [load])
  usePolling(load, 4000)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('user_id,username').eq('status', 'approved').neq('user_id', user.id).order('username')
      .then(({ data }) => setMembers((data ?? []) as Member[]))
  }, [user])

  useEffect(() => {
    const newest = messages[messages.length - 1]?.id ?? null
    if (newest !== lastId.current) {
      lastId.current = newest
      bottom.current?.scrollIntoView({ block: 'end' })
    }
  }, [messages])

  const send = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!text.trim() || busy) return
    setBusy(true)
    const { error } = await supabase.rpc('send_message', { p_body: text, p_recipient: recipient || null, p_anonymous: anonymous })
    setBusy(false)
    if (error) {
      pushToast(humanizeError(error), 'danger')
      return
    }
    setText('')
    await load()
  }

  const remove = async (id: string) => {
    const { error } = await supabase.rpc('delete_message', { p_id: id })
    if (error) pushToast(humanizeError(error), 'danger')
    await load()
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <TerminalShell>
      <section className="r0-intro">
        <div className="terminal-kicker">CANAL COMMUN · <He>שיחה</He></div>
        <h1>Chat</h1>
      </section>
      <section className="chat-box">
        <div className="chat-log">
          {messages.length === 0 && <div className="empty-terminal">canal silencieux.</div>}
          {messages.map((m) => {
            const direct = m.recipient_id !== null
            const toMe = direct && !m.is_mine && m.recipient_id === user?.id
            return (
              <div key={m.id} className={`chat-line ${m.is_mine ? 'mine' : ''} ${direct ? 'direct' : ''}`}>
                <time>{new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</time>
                <strong>
                  {m.sender_name === null ? 'ANONYME' : m.sender_name}
                  {m.anonymous && m.sender_name !== null && ' (masqué)'}
                </strong>
                <span>
                  {direct && <em className="dm-tag">{toMe ? '[privé → vous]' : `[privé → ${m.recipient_name}]`} </em>}
                  {m.body}
                </span>
                {isAdmin && <button className="link-button" onClick={() => void remove(m.id)} aria-label="supprimer">×</button>}
              </div>
            )
          })}
          <div ref={bottom} />
        </div>
        <form className="chat-form" onSubmit={send}>
          <select className="inline-select" value={recipient} onChange={(e) => setRecipient(e.target.value)} aria-label="destinataire">
            <option value="">À TOUS</option>
            {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.username}</option>)}
          </select>
          <input value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} placeholder="> transmettre un message" autoComplete="off" />
          <label className="chat-anon"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> MASQUER MON IDENTITÉ</label>
          <button className="terminal-button" disabled={busy || !text.trim()}>[ ENVOYER ]</button>
        </form>
      </section>
    </TerminalShell>
  )
}
