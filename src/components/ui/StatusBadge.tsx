import type { MissionStatus } from '../../types'

const LABEL: Record<MissionStatus, string> = {
  active: 'EN COURS',
  awaiting_validation: 'ATTENTE VALIDATION',
  validated: 'VALIDÉE',
}
const CLASS: Record<MissionStatus, string> = {
  active: 'status-pending',
  awaiting_validation: 'status-warning',
  validated: 'status-ok',
}

export function StatusBadge({ status }: { status: MissionStatus }) {
  return <span className={`status-badge ${CLASS[status]}`}>{LABEL[status]}</span>
}
