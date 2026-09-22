import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AdminLayout } from '../components/admin/AdminLayout'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useToast } from '../components/ui/Toast'
import { humanizeError } from '../lib/errors'
import type { AdminSubmissionRow, SubmissionStatus } from '../types'
import { PHASES } from '../content/phases'
import { usePolling } from '../hooks/usePolling'

const filters = ['all', 'pending', 'approved', 'rejected', 'revision_requested'] as const

type ReviewMode = 'none' | 'approve' | 'reject' | 'revision'

export function AdminSubmissionsPage() {
  const [rows, setRows] = useState<AdminSubmissionRow[]>([])
  const [filter, setFilter] = useState<(typeof filters)[number]>('pending')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<AdminSubmissionRow | null>(null)
  const [reviewMode, setReviewMode] = useState<ReviewMode>('none')
  const [message, setMessage] = useState('')
  const [coordinates, setCoordinates] = useState('')
  const [busy, setBusy] = useState(false)
  const { pushToast } = useToast()

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('submissions')
      .select('*, profiles!submissions_user_id_fkey(username)')
      .order('created_at', { ascending: false })
    if (error) {
      pushToast(humanizeError(error), 'danger')
      return
    }
    setRows((data ?? []) as AdminSubmissionRow[])
  }, [pushToast])

  useEffect(() => { void load() }, [load])
  usePolling(load, 8000)

  useEffect(() => {
    if (!selected) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) closeModal()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected, busy])

  const visible = useMemo(() => rows.filter((row) => {
    const statusMatch = filter === 'all' || row.status === filter
    const username = row.profiles?.username ?? row.user_id
    const searchMatch = username.toLowerCase().includes(search.toLowerCase())
    return statusMatch && searchMatch
  }), [rows, filter, search])

  const attemptNumber = (row: AdminSubmissionRow) => rows
    .filter((item) => item.user_id === row.user_id && item.phase_no === row.phase_no && item.created_at <= row.created_at)
    .length

  const openSubmission = (row: AdminSubmissionRow) => {
    setSelected(row)
    setReviewMode('none')
    setMessage(row.admin_message ?? '')
    setCoordinates('')
  }

  const resetModal = () => {
    setSelected(null)
    setReviewMode('none')
    setMessage('')
    setCoordinates('')
  }

  const closeModal = () => {
    if (busy) return
    resetModal()
  }

  const review = async (decision: SubmissionStatus) => {
    if (!selected || busy) return
    if (decision === 'approved' && !coordinates.trim()) {
      pushToast('[!!] COORDONNÉES OBLIGATOIRES POUR UNE VALIDATION', 'warning')
      return
    }
    setBusy(true)
    try {
      const { error } = await supabase.rpc('review_submission', {
        p_submission_id: selected.id,
        p_decision: decision,
        p_admin_message: message.trim() || null,
        p_coordinates: decision === 'approved' ? coordinates.trim() : null,
      })
      if (error) throw error
      pushToast(decision === 'approved' ? '[ok] VALIDÉ ET TRANSMIS' : decision === 'rejected' ? '[ok] TRANSMISSION REFUSÉE' : '[ok] COMPLÉMENT DEMANDÉ', 'success')
      resetModal()
      await load()
    } catch (error) {
      pushToast(humanizeError(error), 'danger')
    } finally {
      setBusy(false)
    }
  }

  const phaseName = selected ? PHASES.find((phase) => phase.no === selected.phase_no)?.name : null

  return (
    <AdminLayout>
      <section className="admin-panel">
        <div className="admin-toolbar">
          <div className="filter-row">
            {filters.map((item) => (
              <button key={item} onClick={() => setFilter(item)} className={filter === item ? 'active' : ''}>{item.toUpperCase()}</button>
            ))}
          </div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="RECHERCHER ALIAS" />
        </div>
        <div className="admin-table">
          <div className="admin-table-head"><span>PLAYER</span><span>PHASE</span><span>SUBMITTED</span><span>STATUS</span></div>
          {visible.map((row) => (
            <button className="admin-table-row" key={row.id} onClick={() => openSubmission(row)}>
              <span>{row.profiles?.username ?? row.user_id.slice(0, 8)}</span>
              <span>{PHASES.find((phase) => phase.no === row.phase_no)?.name ?? row.phase_no}</span>
              <span>{new Date(row.created_at).toLocaleString('fr-FR')} · tentative {attemptNumber(row)}</span>
              <StatusBadge status={row.status} />
            </button>
          ))}
        </div>
        {visible.length === 0 && <div className="empty-terminal">aucune transmission dans cette vue.</div>}
      </section>

      {selected && (
        <div className="modal-backdrop" onMouseDown={closeModal}>
          <section className="admin-review-modal" role="dialog" aria-modal="true" aria-label="révision de transmission" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} aria-label="fermer">×</button>
            <div className="terminal-label">TRANSMISSION // {selected.profiles?.username ?? selected.user_id.slice(0, 8)}</div>
            <p>PHASE {selected.phase_no} // {phaseName} · TENTATIVE {attemptNumber(selected)} · {new Date(selected.created_at).toLocaleString('fr-FR')}</p>
            <div className="player-answer">{selected.answer}</div>

            {selected.status === 'pending' ? (
              <>
                {reviewMode === 'none' && (
                  <div className="review-actions review-choice">
                    <button disabled={busy} className="terminal-button danger-button" onClick={() => setReviewMode('reject')}>[ REFUSER ]</button>
                    <button disabled={busy} className="terminal-button" onClick={() => setReviewMode('revision')}>[ DEMANDER COMPLÉMENT ]</button>
                    <button disabled={busy} className="terminal-button success-button" onClick={() => setReviewMode('approve')}>[ VALIDER ]</button>
                  </div>
                )}

                {reviewMode !== 'none' && (
                  <div className={`review-decision-panel review-${reviewMode}`}>
                    <div className="terminal-label">
                      {reviewMode === 'approve' ? 'VALIDATION // TRANSMISSION GPS' : reviewMode === 'reject' ? 'REFUS // RETOUR R-0' : 'COMPLÉMENT // RETOUR R-0'}
                    </div>
                    <label>MESSAGE R-0 — FACULTATIF
                      <textarea rows={4} maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} />
                    </label>
                    {reviewMode === 'approve' && (
                      <label>COORDONNÉES À TRANSMETTRE
                        <input autoFocus maxLength={255} value={coordinates} onChange={(event) => setCoordinates(event.target.value)} placeholder="saisies uniquement maintenant — jamais préchargées" />
                      </label>
                    )}
                    <div className="review-actions">
                      <button disabled={busy} className="terminal-button" onClick={() => setReviewMode('none')}>[ RETOUR ]</button>
                      {reviewMode === 'approve' && <button disabled={busy || !coordinates.trim()} className="terminal-button success-button" onClick={() => void review('approved')}>[ VALIDER ET TRANSMETTRE ]</button>}
                      {reviewMode === 'reject' && <button disabled={busy} className="terminal-button danger-button" onClick={() => void review('rejected')}>[ CONFIRMER LE REFUS ]</button>}
                      {reviewMode === 'revision' && <button disabled={busy} className="terminal-button" onClick={() => void review('revision_requested')}>[ DEMANDER LE COMPLÉMENT ]</button>}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="reviewed-summary">
                <StatusBadge status={selected.status} />
                {selected.admin_message && <p>{selected.admin_message}</p>}
              </div>
            )}
          </section>
        </div>
      )}
    </AdminLayout>
  )
}
