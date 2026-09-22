import type { Transmission } from '../../types'
import { TransmissionReveal } from '../animations/TransmissionReveal'

export function TransmissionPanel({ transmissions, phaseNo }: { transmissions: Transmission[]; phaseNo: number }) {
  const latest = transmissions
    .filter((item) => item.phase_no === phaseNo)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]

  if (!latest) return null

  return (
    <section className="transmission-panel">
      <TransmissionReveal
        transmissionId={latest.id}
        phaseNo={phaseNo}
        coordinates={latest.coordinates}
        message={latest.message}
      />
    </section>
  )
}
