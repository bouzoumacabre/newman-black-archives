import { useEffect, useMemo, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*אמתשער'

export function DecryptText({ text, duration = 1200, className }: { text: string; duration?: number; className?: string }) {
  const reduced = useReducedMotion()
  const target = useMemo(() => [...text], [text])
  const [output, setOutput] = useState(text)

  useEffect(() => {
    if (reduced) {
      setOutput(text)
      return
    }
    const started = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const progress = Math.min(1, (now - started) / duration)
      const fixed = Math.floor(target.length * progress)
      const result = target.map((char, index) => {
        if (char === ' ' || char === '\n') return char
        if (index < fixed) return char
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      }).join('')
      setOutput(result)
      if (progress < 1) raf = requestAnimationFrame(frame)
      else setOutput(text)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [text, duration, reduced, target])

  return <span className={className}>{output}</span>
}
