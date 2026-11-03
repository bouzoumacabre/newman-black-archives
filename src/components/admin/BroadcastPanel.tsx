import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { usePolling } from '../../hooks/usePolling'
import { useToast } from '../ui/Toast'
import { humanizeError } from '../../lib/errors'
import type { Announcement } from '../../types'

export function BroadcastPanel() {
  const { user } = useAuth()
  const { pushToast } = useToast()
  const [items, setItems] = useState<Announcement[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('announcements').select('id,body,active,created_at').eq('active', true).order('created_at', { ascending: false })
    if (error) pushToast(humanizeError(error), 'danger')
    else setItems((data ?? []) as Announcement[])
  }, [pushToast])

  useEffect(() => { void load() }, [load])
  usePolling(load, 8000)

  const publish = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user || !text.trim() || busy) return
    setBusy(true)
    const { error } = await supabase.from('announcements').insert({ body: text.trim(), created_by: user.id })
    setBusy(false)
    if (error) {
      pushToast(humanizeError(error), 'danger')
      return
    }
    pushToast('[ok] MESSAGE DIFFUSÉ SUR TOUS LES ÉCRANS', 'success')
    setText('')
    await load()
  }

  const retire = async (id: string) => {
    const { error } = await supabase.from('announcements').update({ active: false }).eq('id', id)
    if (error) pushToast(humanizeError(error), 'danger')
    await load()
  }

  return (
    <section className="admin-panel">
      <div className="terminal-label">DIFFUSION SUR TOUS LES ÉCRANS</div>
      <form className="auth-form" onSubmit={publish}>
        <label>MESSAGE
          <textarea rows={2} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <button className="terminal-button" disabled={busy || !text.trim()}>[ DIFFUSER ]</button>
      </form>
      {items.map((a) => (
        <div key={a.id} className="mission-head announcement-row">
          <span>{a.body}</span>
          <small>{new Date(a.created_at).toLocaleString('fr-FR')}</small>
          <button className="link-button" onClick={() => void retire(a.id)}>RETIRER</button>
        </div>
      ))}
    </section>
  )
}
