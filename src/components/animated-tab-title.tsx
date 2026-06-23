'use client'

import { useEffect, useRef } from 'react'

const GLYPHS = ['⚖️', '✨', '📜', '🏛️', '⚡']

export function AnimatedTabTitle() {
  const baseTitle = useRef<string>('')
  const idx = useRef(0)
  const visibleAwayRef = useRef(false)

  useEffect(() => {
    baseTitle.current = document.title.replace(/^[^\w]+\s/, '')

    const titleTimer = window.setInterval(() => {
      const glyph = GLYPHS[idx.current % GLYPHS.length]
      idx.current += 1
      const current = document.title.replace(/^[^\w]+\s/, '')
      if (current) baseTitle.current = current
      document.title = `${glyph} ${baseTitle.current}`
    }, 1400)

    const onVis = () => {
      if (document.hidden) {
        visibleAwayRef.current = true
        document.title = `👋 Come back — ${baseTitle.current}`
      } else if (visibleAwayRef.current) {
        visibleAwayRef.current = false
        document.title = baseTitle.current
      }
    }
    document.addEventListener('visibilitychange', onVis)

    // Animated favicon — rotating gradient ring drawn on a canvas.
    let rafId = 0
    let angle = 0
    const canvas = document.createElement('canvas')
    canvas.width = 64; canvas.height = 64
    const ctx = canvas.getContext('2d')
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon'][data-animated]")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      link.setAttribute('data-animated', 'true')
      document.head.appendChild(link)
    }
    const colors = ['#14203E', '#B7913D', '#D4A85A', '#3B5BDB']
    const drawFavicon = () => {
      if (!ctx) return
      ctx.clearRect(0, 0, 64, 64)
      const grad = ctx.createConicGradient(angle, 32, 32)
      colors.forEach((c, i) => grad.addColorStop(i / colors.length, c))
      grad.addColorStop(1, colors[0])
      ctx.strokeStyle = grad
      ctx.lineWidth = 8
      ctx.beginPath()
      ctx.arc(32, 32, 24, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = '#14203E'
      ctx.font = 'bold 28px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('§', 32, 34)
      link!.href = canvas.toDataURL('image/png')
      angle += 0.08
      rafId = window.requestAnimationFrame(drawFavicon)
    }
    rafId = window.requestAnimationFrame(drawFavicon)

    return () => {
      window.clearInterval(titleTimer)
      document.removeEventListener('visibilitychange', onVis)
      window.cancelAnimationFrame(rafId)
      document.title = baseTitle.current
    }
  }, [])

  return null
}
