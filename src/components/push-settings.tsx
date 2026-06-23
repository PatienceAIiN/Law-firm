'use client'

import { useState, useEffect } from 'react'
import { Bell, Loader2 } from 'lucide-react'
import { savePushSubscription, removePushSubscription, checkPushSubscription } from '@/app/actions/web-push'

function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushSettings({ role, userId }: { role: 'admin' | 'advocate', userId: string }) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            checkPushSubscription(sub.endpoint).then((res) => {
              setIsSubscribed(res.subscribed)
              setLoading(false)
            })
          } else {
            setIsSubscribed(false)
            setLoading(false)
          }
        })
      })
    } else {
      setLoading(false)
    }
  }, [])

  const handleToggle = async () => {
    try {
      setLoading(true)
      setError('')
      const reg = await navigator.serviceWorker.ready

      if (isSubscribed) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await sub.unsubscribe()
          await removePushSubscription(sub.endpoint)
        }
        setIsSubscribed(false)
      } else {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          throw new Error('Notification permission denied')
        }

        const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!pubKey) throw new Error('VAPID public key not found')

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(pubKey),
        })

        const res = await savePushSubscription(JSON.parse(JSON.stringify(sub)), role, userId)
        if (!res.success) throw new Error(res.error || 'Failed to save subscription')
        setIsSubscribed(true)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10 text-sm text-slate-500">
        Push notifications are not supported in this browser.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#11151f]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Push Notifications</h3>
            <p className="text-xs text-slate-500">Get notified instantly about new inquiries and cases.</p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isSubscribed ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          {loading && <Loader2 className="absolute -left-5 h-4 w-4 animate-spin text-slate-400" />}
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isSubscribed ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      {error && <div className="mt-3 text-xs text-rose-500">{error}</div>}
    </div>
  )
}
