import { useReducedMotion } from '../../hooks/useReducedMotion'

export function NetworkPulse({ severity = 1 }: { severity?: number }) {
  const reduced = useReducedMotion()
  const level = Math.min(4, Math.max(1, severity))
  return (
    <div className={`network-pulse network-pulse-${level} ${reduced ? 'network-pulse-static' : ''}`} aria-hidden="true">
      <span />
    </div>
  )
}
