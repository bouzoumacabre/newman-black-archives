import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export function MissionImage({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!path) return
    let active = true
    supabase.storage.from('mission-orders').createSignedUrl(path, 3600).then(({ data, error }) => {
      if (!active) return
      if (error || !data) setFailed(true)
      else setUrl(data.signedUrl)
    })
    return () => { active = false }
  }, [path])

  if (!path) return null
  if (failed) return <div className="empty-terminal">[xx] ordres illisibles — image indisponible.</div>
  if (!url) return <div className="empty-terminal">déchiffrement des ordres...</div>
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img className="mission-image" src={url} alt="ordres de mission" />
    </a>
  )
}
