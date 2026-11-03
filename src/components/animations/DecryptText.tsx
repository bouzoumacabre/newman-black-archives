import { useEffect, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const POOL = '01#@%$&*+=<>/|אמשרתסקל'

// Scrambles, then resolves left to right.
export function DecryptText({ text, duration = 800 }: { text: string; duration?: number }) {
  const reduced = useReducedMotion()
  const [out, setOut] = useState(reduced ? text : '')

  useEffect(() => {
    if (reduced) {
      setOut(text)
      return
    }
    const start = performance.now()
    const timer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - start) / duration)
      const fixed = Math.floor(progress * text.length)
      setOut(text.split('').map((c, i) => (i < fixed || c === ' ' ? c : POOL[Math.floor(Math.random() * POOL.length)])).join(''))
      if (progress >= 1) window.clearInterval(timer)
    }, 40)
    return () => window.clearInterval(timer)
  }, [text, duration, reduced])

  return <>{out}</>
}
