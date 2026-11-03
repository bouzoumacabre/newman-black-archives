import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { usePolling } from '../../hooks/usePolling'
import { He } from '../animations/HebrewWord'
import type { Announcement } from '../../types'

// Broadcast from the admin, shown on every screen of an approved member until retired.
export function AnnouncementBanner() {
  const [items, setItems] = useState<Announcement[]>([])

  const load = useCallback(async () => {
    const { data } = await supabase.from('announcements').select('id,body,active,created_at').eq('active', true).order('created_at', { ascending: false }).limit(3)
    setItems((data ?? []) as Announcement[])
  }, [])

  // usePolling waits one interval before its first run: fetch once on mount too.
  useEffect(() => { void load() }, [load])
  usePolling(load, 6000)

  if (items.length === 0) return null
  return (
    <div className="announcement-stack" role="alert">
      {items.map((item) => (
        <div key={item.id} className="announcement">
          <span className="announcement-tag">DIFFUSION · <He>שידור</He></span>
          <span>{item.body}</span>
        </div>
      ))}
    </div>
  )
}
