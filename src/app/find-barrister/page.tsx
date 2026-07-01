import { prisma } from '@/lib/prisma'
import { FindBarristerClient } from './find-barrister-client'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Find a Barrister — Patience AI' }

type SP = { state?: string; city?: string; q?: string; tab?: string; pincode?: string }

export default async function FindBarristerPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { state, city, q, tab, pincode } = await searchParams
  const activeTab = (tab === 'firms' ? 'firms' : 'lawyers') as 'firms' | 'lawyers'

  let firms: any[] = []
  let lawyers: any[] = []
  // Set of tenantIds that currently have at least one active future slot
  // with capacity > bookedCount. Used to gate the Book Consultation CTA.
  const tenantsWithSlots = new Set<string>()
  try {
    const where: any = { status: 'active' }
    if (state) where.state = state
    if (city) where.city = city
    if (pincode) where.pincode = pincode
    if (q) where.name = { contains: q, mode: 'insensitive' }
    firms = await prisma.tenant.findMany({
      where, take: 60, orderBy: { name: 'asc' },
      select: { id: true, slug: true, name: true, state: true, city: true, locality: true, pincode: true, ownerEmail: true } as any,
    })
  } catch (e) { console.warn('[find-barrister] firms query skipped:', (e as any)?.message) }

  try {
    // Lawyers must belong to a tenant whose status is 'active'. Suspended
    // or deleted tenants drop their lawyers from the directory instantly.
    const where: any = { isActive: true, tenantId: { not: null }, tenant: { status: 'active' } }
    if (state) where.state = state
    if (city) where.city = city
    if (pincode) where.pincode = pincode
    if (q) where.name = { contains: q, mode: 'insensitive' }
    lawyers = await prisma.advocate.findMany({
      where, take: 60, orderBy: { name: 'asc' },
      select: { id: true, name: true, title: true, profileImage: true, expertise: true, bio: true, state: true, city: true, locality: true, pincode: true, tenantId: true,
        tenant: { select: { slug: true, name: true } } } as any,
    })
  } catch (e) { console.warn('[find-barrister] lawyers query skipped:', (e as any)?.message) }

  try {
    const tenantIds = Array.from(new Set([
      ...firms.map((f) => f.id),
      ...lawyers.map((l) => l.tenantId).filter(Boolean),
    ]))
    if (tenantIds.length) {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const rows = await prisma.availabilitySlot.findMany({
        where: {
          isActive: true,
          day: { tenantId: { in: tenantIds }, isActive: true, date: { gte: today } },
        },
        select: { capacity: true, bookedCount: true, day: { select: { tenantId: true } } },
        take: 1000,
      })
      for (const s of rows) {
        if (s.day?.tenantId && (s.capacity || 0) > (s.bookedCount || 0)) tenantsWithSlots.add(s.day.tenantId)
      }
    }
  } catch (e) { console.warn('[find-barrister] slots query skipped:', (e as any)?.message) }

  return (
    <FindBarristerClient
      initialTab={activeTab}
      initialState={state || ''}
      initialCity={city || ''}
      initialPincode={pincode || ''}
      initialQ={q || ''}
      firms={firms.map((f) => ({ id: f.id, slug: f.slug, name: f.name, state: f.state, city: f.city, locality: f.locality, hasSlots: tenantsWithSlots.has(f.id) }))}
      lawyers={lawyers.map((l) => ({
        id: l.id, name: l.name, title: l.title, profileImage: l.profileImage,
        expertise: l.expertise, bio: l.bio, state: l.state, city: l.city, locality: l.locality,
        firmTenantId: l.tenantId || null,
        firmSlug: l.tenant?.slug || null, firmName: l.tenant?.name || null,
        hasSlots: l.tenantId ? tenantsWithSlots.has(l.tenantId) : false,
      }))}
    />
  )
}
