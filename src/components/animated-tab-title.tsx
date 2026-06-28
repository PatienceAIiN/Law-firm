'use client'

import { useEffect } from 'react'

const GLYPHS = ['⚖️', '✨', '📜', '🏛️', '⚡']

// Single dynamic glyph + favicon-ring for tenant admin / lawyer / public
// pages. Captures the page's title ONCE at mount (so the rotating glyph
// can't accumulate). No visibilitychange "come back" overlay — that was
// stacking "Come back — Come back — …" on every tab flip.
export function AnimatedTabTitle() {
  useEffect(() => {
    const isTenantPage = /^\/(team|t)\//.test(window.location.pathname)
    if (!isTenantPage) return

    // Snapshot at mount only. Future setTitle calls don't read it back.
    const baseTitle = (document.title || 'Workspace').replace(/^[^\w]+\s+/, '').trim()
    let idx = 0
    const titleTimer = window.setInterval(() => {
      const glyph = GLYPHS[idx % GLYPHS.length]
      idx += 1
      document.title = `${glyph} ${baseTitle}`
    }, 1800)

    // Animated favicon — rotating gradient ring with § glyph.
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
      window.cancelAnimationFrame(rafId)
      document.title = baseTitle
    }
  }, [])

  return null
}
