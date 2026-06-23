'use server'

import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:engineering@patienceai.in',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function savePushSubscription(
  subscription: any,
  role: 'admin' | 'advocate',
  userId: string
) {
  if (!subscription || !subscription.endpoint) return { success: false, error: 'Invalid subscription' }

  try {
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint },
    })

    if (!existing) {
      await prisma.pushSubscription.create({
        data: {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          adminUserId: role === 'admin' ? userId : null,
          advocateId: role === 'advocate' ? userId : null,
        },
      })
    } else {
      await prisma.pushSubscription.update({
        where: { endpoint: subscription.endpoint },
        data: {
          adminUserId: role === 'admin' ? userId : null,
          advocateId: role === 'advocate' ? userId : null,
        },
      })
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function removePushSubscription(endpoint: string) {
  if (!endpoint) return { success: false }
  try {
    await prisma.pushSubscription.delete({ where: { endpoint } })
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function checkPushSubscription(endpoint: string) {
  try {
    const sub = await prisma.pushSubscription.findUnique({ where: { endpoint } })
    return { subscribed: !!sub }
  } catch {
    return { subscribed: false }
  }
}

export async function sendPushNotification(
  target: { adminUserId?: string; advocateId?: string },
  payload: { title: string; body: string; url?: string }
) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      OR: [
        { adminUserId: target.adminUserId || undefined },
        { advocateId: target.advocateId || undefined }
      ]
    }
  })

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ ...payload, icon: '/icon-192.png' })
      )
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } })
      }
    }
  }
}
