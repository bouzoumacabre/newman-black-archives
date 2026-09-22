import { useMemo, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

interface Line {
  id: number
  text: string
  tone?: 'normal' | 'ok' | 'danger' | 'muted'
}

export function R0CommandPrompt({ maxPhase }: { maxPhase: number }) {
  const { profile } = useAuth()
  const [command, setCommand] = useState('')
  const [lines, setLines] = useState<Line[]>([
    { id: 1, text: 'canal établi. Tapez help pour la liste des commandes.', tone: 'muted' },
  ])
  const seq = useRef(10)

  const nodes = useMemo(() => {
    if (maxPhase >= 4) return ['ROXWOOD ........ LOST', 'SANDY SHORES ... OFFLINE', 'TEL-AVIV ....... NO RESPONSE', 'GALAPAGOS ...... ACTIVE']
    if (maxPhase >= 3) return ['R-0 ............ ONLINE', 'E-1 ............ ONLINE', 'C-7 ............ UNSTABLE', 'G-7 ............ SIGNAL']
    if (maxPhase >= 2) return ['R-0 ............ ONLINE', 'E-1 ............ ONLINE', 'C-7 ............ SEALED', 'G-7 ............ WEAK']
    return ['R-0 ............ ONLINE', 'E-1 ............ SEALED', 'C-7 ............ SEALED', 'G-7 ............ WEAK']
  }, [maxPhase])

  const line = (text: string, tone: Line['tone'] = 'normal'): Line => {
    seq.current += 1
    return { id: seq.current, text, tone }
  }

  const run = (event: React.FormEvent) => {
    event.preventDefault()
    const raw = command.trim()
    const cmd = raw.toLowerCase()
    if (!cmd) return
    setCommand('')

    if (cmd === 'clear') {
      setLines([])
      return
    }

    const next: Line[] = [line(`r0> ${raw}`)]

    if (cmd === 'help') {
      next.push(line('help · status · whoami · nodes · trace · fingerprint · motd · clear', 'muted'))
    } else if (cmd === 'status') {
      const integrity = maxPhase >= 4 ? '14%' : maxPhase === 3 ? '43%' : maxPhase === 2 ? '62%' : '71%'
      next.push(line(`CANAL ${maxPhase >= 4 ? 'INSTABLE' : 'OUVERT'} // CLEARANCE PH-${maxPhase} // INTEGRITY ${integrity}`, maxPhase >= 4 ? 'danger' : 'ok'))
    } else if (cmd === 'whoami') {
      next.push(line(`GHOST IDENTITY: ${profile?.username ?? 'UNKNOWN'} // AUTHORITY: ${profile?.role === 'admin' ? 'GM' : 'NONE'}`, 'muted'))
    } else if (cmd === 'nodes') {
      nodes.forEach((node) => next.push(line(node, node.includes('LOST') || node.includes('OFFLINE') ? 'danger' : 'muted')))
    } else if (cmd === 'trace') {
      next.push(line('route ............ onion/relay-chain', 'muted'))
      next.push(line(`relays ........... ${maxPhase >= 4 ? '2/7' : maxPhase >= 3 ? '5/7' : '7/7'}`, maxPhase >= 4 ? 'danger' : 'muted'))
      next.push(line('origin ........... MASKED', 'muted'))
      if (maxPhase >= 3) next.push(line('foreign session .. S.F. // signature incomplete', 'danger'))
    } else if (cmd === 'fingerprint') {
      next.push(line('BNW-VLT-1924 // archive fingerprint intact', 'ok'))
      next.push(line(maxPhase >= 3 ? 'secondary signature: A.N. / S.F. mismatch' : 'secondary signature: A.N. // UNKNOWN', 'muted'))
    } else if (cmd === 'motd' || cmd === 'cat /etc/motd') {
      next.push(line(maxPhase >= 3 ? "Je n'ai pas ouvert tous les canaux que vous voyez. — R-0" : 'Lisez. Recoupez. Ne cherchez pas encore l’argent. — R-0', 'muted'))
    } else if (cmd.startsWith('ping ')) {
      const target = cmd.slice(5).trim().toUpperCase()
      if (target === 'G-7') {
        next.push(line(maxPhase >= 4 ? 'G-7 -> GALAPAGOS // 42ms // ACTIVE' : 'G-7 // réponse partielle // identité du nœud masquée', maxPhase >= 4 ? 'ok' : 'muted'))
      } else {
        next.push(line(`${target || 'UNKNOWN'} // NO ROUTE`, 'danger'))
      }
    } else {
      next.push(line(`commande inconnue: ${raw}`, 'danger'))
      next.push(line('tapez help', 'muted'))
    }

    setLines((prev) => [...prev.slice(-18), ...next])
  }

  return (
    <section className="r0-command" aria-label="terminal interactif R-0">
      <div className="r0-command-output" aria-live="polite">
        {lines.map((entry) => <div key={entry.id} className={`cmd-${entry.tone ?? 'normal'}`}>{entry.text}</div>)}
      </div>
      <form onSubmit={run} className="r0-command-form">
        <label htmlFor="r0-command-input">r0&gt;</label>
        <input
          id="r0-command-input"
          value={command}
          onChange={(event) => setCommand(event.target.value.slice(0, 80))}
          autoComplete="off"
          spellCheck={false}
          aria-label="commande terminal R-0"
        />
        <span className="cursor">_</span>
      </form>
    </section>
  )
}
