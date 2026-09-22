import { useEffect, useState } from 'react'
import { SYSTEM_LOGS } from '../../content/systemLogs'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { GlitchText } from '../animations/GlitchText'

export function SystemLogFeed({ phaseNo }: { phaseNo: number }) {
  const logs = SYSTEM_LOGS[phaseNo] ?? []
  const reduced = useReducedMotion()
  const [count, setCount] = useState(reduced ? logs.length : 3)

  useEffect(() => {
    if (reduced) { setCount(logs.length); return }
    const timer = window.setInterval(() => setCount((value) => value >= logs.length ? 3 : value + 1), 1800)
    return () => window.clearInterval(timer)
  }, [logs.length, reduced])

  return (
    <div className="system-log-feed" aria-label="journal système narratif">
      {(reduced ? logs : logs.slice(0, count)).map((log, index) => (
        <div key={`${log}-${index}`} className={log.includes('[!!]') || log.includes('[xx]') ? 'log-alert' : ''}>
          {log.includes('GALAPAGOS') || log.includes('S.F.') ? <GlitchText children={log} active /> : log}
        </div>
      ))}
    </div>
  )
}
