import { useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { humanizeError } from '../../lib/errors'
import { useToast } from '../ui/Toast'
import type { Submission } from '../../types'
import { R0_PHASE_MESSAGES } from '../../content/systemLogs'

export function SubmissionTerminal({ phaseNo, submissions, onSubmitted }: { phaseNo: number; submissions: Submission[]; onSubmitted: () => Promise<void> }) {
  const { user } = useAuth()
  const { pushToast } = useToast()
  const [answer, setAnswer] = useState('')
  const [sending, setSending] = useState(false)
  const latest = submissions.filter((item) => item.phase_no === phaseNo).sort((a,b) => b.created_at.localeCompare(a.created_at))[0]
  const blocked = latest?.status === 'pending' || latest?.status === 'approved'
  const canRetry = !latest || latest.status === 'rejected' || latest.status === 'revision_requested'
  const messages = R0_PHASE_MESSAGES[phaseNo]

  const attempt = useMemo(() => submissions.filter((item) => item.phase_no === phaseNo).length + 1, [submissions, phaseNo])

  const submit = async () => {
    if (!user || sending) return
    const clean = answer.trim()
    if (clean.length < 80) {
      pushToast('[!!] ANALYSE TROP COURTE — 80 CARACTÈRES MINIMUM', 'warning')
      return
    }
    if (clean.length > 10000) {
      pushToast('[!!] PAQUET TROP VOLUMINEUX — 10000 CARACTÈRES MAXIMUM', 'danger')
      return
    }
    setSending(true)
    try {
      const { error } = await supabase.from('submissions').insert({
        user_id: user.id,
        phase_no: phaseNo,
        answer: clean,
        status: 'pending',
      })
      if (error) throw error
      setAnswer('')
      pushToast('[ok] TRANSMISSION COMPILÉE — DESTINATAIRE R-0', 'success')
      await onSubmitted()
    } catch (err) {
      pushToast(humanizeError(err), 'danger')
    } finally {
      setSending(false)
    }
  }

  if (latest?.status === 'pending') {
    return (
      <div className="submission-terminal pending-block">
        <div className="terminal-label">TRANSMISSION COMPILÉE</div>
        <pre>{`DESTINATAIRE ........ R-0\nSTATUT ............... EN ATTENTE\nCANAL ................ CHIFFRÉ\nTENTATIVE ............ ${submissions.filter(s => s.phase_no === phaseNo).length}`}</pre>
        <p>NE FERMEZ PAS LE CANAL.</p>
      </div>
    )
  }

  if (latest?.status === 'approved') {
    return <div className="submission-terminal approved-block"><div className="terminal-label">ANALYSE ACCEPTÉE</div><p>Le paquet a été validé. Consultez la transmission récupérée.</p></div>
  }

  return (
    <div className="submission-terminal">
      <div className="terminal-label">COMPILATION REQUISE — FRAGMENT {phaseNo}</div>
      {messages?.map((message) => <p key={message}>{message}</p>)}
      {latest && (latest.status === 'rejected' || latest.status === 'revision_requested') && (
        <div className={`review-message ${latest.status}`}>
          <strong>{latest.status === 'rejected' ? 'TRANSMISSION RETURNED' : 'ADDITIONAL DATA REQUIRED'}</strong>
          {latest.admin_message && <p>{latest.admin_message}</p>}
          <span>— R-0</span>
        </div>
      )}
      <label htmlFor={`analysis-${phaseNo}`}>CE QUE VOUS AVEZ COMPRIS</label>
      <textarea
        id={`analysis-${phaseNo}`}
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        maxLength={10000}
        rows={9}
        disabled={blocked || !canRetry}
        placeholder="Écrivez-le avec vos mots. R-0 ne note pas l'orthographe. Il note si vous avez vu ce qu'il fallait voir."
      />
      <div className="submission-footer">
        <span>TENTATIVE {attempt} · {answer.length}/10000</span>
        <button className="terminal-button" onClick={() => void submit()} disabled={sending || answer.trim().length < 80}>
          {sending ? '[ COMPILATION... ]' : '[ COMPILER LA TRANSMISSION ]'}
        </button>
      </div>
    </div>
  )
}
