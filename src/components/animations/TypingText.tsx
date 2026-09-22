import { useEffect, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface Props {
  text: string
  speed?: number
  className?: string
  onDone?: () => void
  cursor?: boolean
}

export function TypingText({ text, speed = 18, className, onDone, cursor = false }: Props) {
  const reduced = useReducedMotion()
  const [visible, setVisible] = useState(reduced ? text : '')

  useEffect(() => {
    if (reduced) {
      setVisible(text)
      onDone?.()
      return
    }
    setVisible('')
    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setVisible(text.slice(0, index))
      if (index >= text.length) {
        window.clearInterval(timer)
        onDone?.()
      }
    }, speed)
    return () => window.clearInterval(timer)
  }, [text, speed, reduced, onDone])

  return <span className={className}>{visible}{cursor && <span className="cursor">_</span>}</span>
}
