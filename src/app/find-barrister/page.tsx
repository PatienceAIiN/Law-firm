import { prisma } from '@/lib/prisma'
import { FindBarristerClient } from './find-barrister-client'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Find a Barrister — Patience AI' }

type SP = { state?: string; city?: string; q?: string; tab?: string }

export default async function FindBarristerPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { state, city, q, tab } = await searchParams
  const activeTab = (tab === 'firms' ? 'firms' : 'lawyers') as 'firms' | 'lawyers'

  let firms: any[] = []
  let lawyers: any[] = []
  try {
    const where: any = { status: 'active' }
    if (state) where.state = state
    if (city) where.city = city
    if (q) where.name = { contains: q, mode: 'insensitive' }
    firms = await prisma.tenant.findMany({
      where, take: 60, orderBy: { name: 'asc' },
      select: { id: true, slug: true, name: true, state: true, city: true, locality: true, ownerEmail: true },
    })
  } catch (e) { console.warn('[find-barrister] firms query skipped:', (e as any)?.message) }

  try {
    const where: any = { isActive: true, tenantId: { not: null } }
    if (state) where.state = state
    if (city) where.city = city
    if (q) where.name = { contains: q, mode: 'insensitive' }
    lawyers = await prisma.advocate.findMany({
      where, take: 60, orderBy: { name: 'asc' },
      select: { id: true, name: true, title: true, profileImage: true, expertise: true, bio: true, state: true, city: true, locality: true, tenantId: true,
        tenant: { select: { slug: true, name: true } } },
    })
  } catch (e) { console.warn('[find-barrister] lawyers query skipped:', (e as any)?.message) }

  return (
    <FindBarristerClient
      initialTab={activeTab}
      initialState={state || ''}
      initialCity={city || ''}
      initialQ={q || ''}
      firms={firms.map((f) => ({ id: f.id, slug: f.slug, name: f.name, state: f.state, city: f.city, locality: f.locality }))}
      lawyers={lawyers.map((l) => ({
        id: l.id, name: l.name, title: l.title, profileImage: l.profileImage,
        expertise: l.expertise, bio: l.bio, state: l.state, city: l.city, locality: l.locality,
        firmSlug: l.tenant?.slug || null, firmName: l.tenant?.name || null,
      }))}
    />
  )
}
