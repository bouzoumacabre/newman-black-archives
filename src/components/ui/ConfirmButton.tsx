import { useEffect, useState } from 'react'

interface Props {
  label: string
  confirmLabel: string
  onConfirm: () => void
  className?: string
  disabled?: boolean
}

// Two clicks instead of window.confirm: the FiveM browser never shows native dialogs,
// so window.confirm would silently cancel the action there.
export function ConfirmButton({ label, confirmLabel, onConfirm, className, disabled }: Props) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const timer = window.setTimeout(() => setArmed(false), 4000)
    return () => window.clearTimeout(timer)
  }, [armed])

  const click = () => {
    if (!armed) {
      setArmed(true)
      return
    }
    setArmed(false)
    onConfirm()
  }

  return <button type="button" className={className} disabled={disabled} onClick={click}>{armed ? confirmLabel : label}</button>
}
