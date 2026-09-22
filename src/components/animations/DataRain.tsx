import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ:/#@%אמשרתס'

export function DataRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || reduced) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let last = 0
    const font = 13
    let drops: number[] = []

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(window.innerWidth * ratio)
      canvas.height = Math.floor(window.innerHeight * ratio)
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      const cols = Math.ceil(window.innerWidth / font)
      drops = Array.from({ length: cols }, () => Math.random() * -80)
    }

    const draw = (time: number) => {
      raf = requestAnimationFrame(draw)
      if (document.hidden || time - last < 85) return
      last = time
      ctx.fillStyle = 'rgba(8,8,6,0.08)'
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
      ctx.font = `${font}px monospace`
      ctx.fillStyle = 'rgba(201,133,34,0.065)'
      drops.forEach((drop, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillText(char, i * font, drop * font)
        drops[i] = drop + 0.23
        if (drops[i] * font > window.innerHeight && Math.random() > 0.992) drops[i] = -10
      })
    }

    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [reduced])

  if (reduced) return null
  return <canvas ref={canvasRef} className="data-rain" aria-hidden="true" />
}
