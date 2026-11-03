import { useEffect, useState } from 'react'
import { HEBREW, pickHebrew } from '../../content/hebrew'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export function He({ children }: { children: string }) {
  return <span className="he" lang="he" dir="rtl">{children}</span>
}

// A Hebrew word that swaps every few seconds.
export function HebrewWord({ every = 3200 }: { every?: number }) {
  const reduced = useReducedMotion()
  const [word, setWord] = useState(HEBREW[0])
  useEffect(() => {
    if (reduced) return
    const timer = window.setInterval(() => setWord(pickHebrew()), every)
    return () => window.clearInterval(timer)
  }, [every, reduced])
  return <He>{word}</He>
}
