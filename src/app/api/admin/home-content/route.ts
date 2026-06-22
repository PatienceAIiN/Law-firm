import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const value = JSON.stringify({
    title: String(body.title || ''),
    subtitle: String(body.subtitle || ''),
    ctaLabel: String(body.ctaLabel || ''),
    ctaHref: String(body.ctaHref || '/consultation'),
    features: Array.isArray(body.features)
      ? body.features.slice(0, 6).map((f: any) => ({ title: String(f.title || ''), desc: String(f.desc || '') }))
      : [],
  })

  await prisma.siteSetting.upsert({
    where: { key: 'home_content' },
    update: { value },
    create: { key: 'home_content', value },
  })
  revalidatePath('/')
  return NextResponse.json({ success: true })
}
