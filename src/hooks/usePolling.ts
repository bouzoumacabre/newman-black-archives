import { useEffect, useRef } from 'react'

export function usePolling(callback: () => void | Promise<void>, intervalMs = 8000, enabled = true) {
  const saved = useRef(callback)
  saved.current = callback

  useEffect(() => {
    if (!enabled) return
    let timer: number | undefined

    const run = () => {
      if (!document.hidden) void saved.current()
    }

    const start = () => {
      window.clearInterval(timer)
      timer = window.setInterval(run, intervalMs)
    }

    const onVisibility = () => {
      if (!document.hidden) {
        run()
        start()
      } else {
        window.clearInterval(timer)
      }
    }

    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [intervalMs, enabled])
}
