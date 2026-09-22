export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const cls = normalized === 'approved' || normalized === 'cleared' || normalized === 'active'
    ? 'status-ok'
    : normalized === 'rejected' || normalized === 'locked' || normalized === 'access denied' || normalized === 'retry'
      ? 'status-danger'
      : normalized === 'revision_requested' || normalized === 'revision required'
        ? 'status-warning'
        : 'status-pending'

  const label = status.replaceAll('_', ' ').toUpperCase()
  return <span className={`status-badge ${cls}`}>{label}</span>
}
