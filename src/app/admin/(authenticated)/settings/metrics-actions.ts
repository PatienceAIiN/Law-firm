'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateMetrics(metrics: any[]) {
  // Clear and re-insert for simplicity in this key-value type setup
  // Or handle individual upserts. For 3-5 items, upsert is better.
  for (const m of metrics) {
    if (m.id) {
      await prisma.siteMetric.update({
        where: { id: m.id },
        data: {
          label: m.label,
          value: m.value,
          icon: m.icon,
          order: m.order
        }
      })
    } else {
      await prisma.siteMetric.create({
        data: {
          label: m.label,
          value: m.value,
          icon: m.icon,
          order: m.order
        }
      })
    }
  }
  revalidatePath('/')
  revalidatePath('/admin/settings')
}

export async function deleteMetric(id: string) {
  await prisma.siteMetric.delete({ where: { id } })
  revalidatePath('/')
}
