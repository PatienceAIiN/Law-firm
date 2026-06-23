'use client'

import { useEffect, useState } from 'react'

export function WelcomeGreeting() {
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter')

  useEffect(() => {
    // Show only once per session
    const shown = sessionStorage.getItem('law_greeting_shown')
    if (shown) return

    sessionStorage.setItem('law_greeting_shown', '1')
    setVisible(true)

    // Play subtle chime using Web Audio API
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const playNote = (freq: number, start: number, dur: number, gain = 0.18) => {
        const osc = ctx.createOscillator()
        const gainNode = ctx.createGain()
        osc.connect(gainNode)
        gainNode.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
        gainNode.gain.setValueAtTime(0, ctx.currentTime + start)
        gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.05)
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
        osc.start(ctx.currentTime + start)
        osc.stop(ctx.currentTime + start + dur)
      }
      // Gentle 3-note chime: C5 → E5 → G5
      playNote(523.25, 0,    0.6)
      playNote(659.25, 0.18, 0.6)
      playNote(783.99, 0.36, 0.9)
    } catch { /* AudioContext not available */ }

    // Animation phases
    const holdTimer = setTimeout(() => setPhase('hold'), 400)
    const exitTimer = setTimeout(() => setPhase('exit'), 2600)
    const hideTimer = setTimeout(() => setVisible(false), 3200)

    return () => {
      clearTimeout(holdTimer)
      clearTimeout(exitTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center pointer-events-none transition-all duration-500 ${
        phase === 'exit' ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
      }`}
    >
      {/* Soft radial glow */}
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />

      <div
        className={`relative flex flex-col items-center gap-3 transition-all duration-500 ${
          phase === 'enter' ? 'translate-y-6 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        {/* Waving hand */}
        <span
          className="text-7xl select-none"
          style={{
            display: 'inline-block',
            animation: 'wave 1.4s ease-in-out 2',
            transformOrigin: '70% 70%',
          }}
        >
          👋
        </span>

        {/* Hi text */}
        <div className="text-center">
          <p className="text-4xl font-black text-white uppercase tracking-widest">Hi There</p>
          <p className="text-primary font-bold text-sm uppercase tracking-[0.3em] mt-1">
            Welcome to Our Law Firm
          </p>
        </div>
      </div>

      <style>{`
        @keyframes wave {
          0%   { transform: rotate(0deg); }
          15%  { transform: rotate(18deg); }
          30%  { transform: rotate(-12deg); }
          45%  { transform: rotate(18deg); }
          60%  { transform: rotate(-8deg); }
          75%  { transform: rotate(12deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  )
}
