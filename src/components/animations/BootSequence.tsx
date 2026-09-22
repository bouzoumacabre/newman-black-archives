import { useEffect, useState } from 'react'
import { TypingText } from './TypingText'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const LINES = [
  'BNW-VLT-1924',
  'INITIALIZING NEWMAN PRIVATE NETWORK...',
  'SEARCHING ARCHIVE NODES...',
  'BLACK ARCHIVES FOUND.',
  'REMOTE CONNECTION DETECTED.',
  'ORIGIN ............... UNKNOWN',
  'AUTHORIZATION ........ NONE',
  'FIREWALL ............. ACTIVE',
  'OVERRIDE ............. DETECTED',
  'GHOST PROTOCOL ....... AVAILABLE',
]

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(reduced ? LINES.length : 0)

  useEffect(() => {
    if (reduced) setIndex(LINES.length)
  }, [reduced])

  return (
    <div className="boot-screen">
      <button className="boot-skip" onClick={onComplete}>PASSER</button>
      <div className="boot-terminal" aria-live="polite">
        {LINES.slice(0, Math.min(index + 1, LINES.length)).map((line, i) => (
          <div key={line} className={i === 0 ? 'boot-brand' : 'boot-line'}>
            {i < index || reduced ? line : (
              <TypingText text={line} speed={i === 0 ? 35 : 12} onDone={() => setTimeout(() => setIndex((n) => Math.min(n + 1, LINES.length)), 90)} />
            )}
          </div>
        ))}
        {index >= LINES.length && (
          <div className="boot-entry">
            <h1>NEWMAN BLACK ARCHIVES</h1>
            <div className="terminal-rule" />
            <button className="terminal-button" onClick={onComplete}>[ INITIALISER LA CONNEXION ]</button>
          </div>
        )}
      </div>
    </div>
  )
}
