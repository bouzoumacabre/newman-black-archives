import { useEffect, useState } from 'react'
import { pickHebrew } from '../../content/hebrew'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const hex = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase()
const rnd = (n: number) => Math.floor(Math.random() * n)
const ip = () => `${10 + rnd(200)}.${rnd(255)}.${rnd(255)}.${rnd(255)}`

const MAKERS: Array<() => string> = [
  () => `[ok] handshake ............ 0x${hex(8)}`,
  () => `[..] relais ${1 + rnd(7)} -> ${ip()}`,
  () => `[ok] clé éphémère ......... ${hex(16)}`,
  () => `[!!] trace entrante ....... masquée ${pickHebrew()}`,
  () => `> decrypt --block ${hex(4)} ${hex(4)} ${hex(4)}`,
  () => `[ok] paquet ${hex(6)} ......... ${pickHebrew()}`,
  () => `[..] scan ports ........... ${rnd(65535)} fermé`,
  () => `[ok] empreinte ............ ${hex(12)}`,
  () => `> tunnel --reroute ${ip()} :: ${pickHebrew()}`,
  () => `[xx] intrusion bloquée .... ${ip()}`,
]

const next = () => MAKERS[rnd(MAKERS.length)]()

export function HackFeed({ lines = 8 }: { lines?: number }) {
  const reduced = useReducedMotion()
  const [log, setLog] = useState<string[]>(() => Array.from({ length: lines }, next))

  useEffect(() => {
    if (reduced) return
    const timer = window.setInterval(() => setLog((prev) => [...prev.slice(-(lines - 1)), next()]), 1100)
    return () => window.clearInterval(timer)
  }, [lines, reduced])

  return (
    <div className="hack-feed" aria-hidden="true">
      {log.map((line, i) => <div key={`${i}-${line}`} className={line.startsWith('[!!]') || line.startsWith('[xx]') ? 'warn' : ''}>{line}</div>)}
    </div>
  )
}

export function HackTicker() {
  const text = Array.from({ length: 14 }, () => `0x${hex(6)} ${pickHebrew()} ${hex(4)}`).join('   ·   ')
  return <div className="hack-ticker" aria-hidden="true"><span>{text}   ·   {text}</span></div>
}

export function ConfidentialStamp() {
  return <div className="confidential-stamp" aria-hidden="true">CONFIDENTIEL <span className="he" lang="he" dir="rtl">סודי ביותר</span></div>
}
