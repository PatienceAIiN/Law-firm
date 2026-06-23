import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSuperAdmin } from '@/lib/super-admin'
import { normalizeSlug, isReservedSlug } from '@/lib/tenant'
import bcrypt from 'bcryptjs'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!isSuperAdmin(session?.user?.email)) {
    return false
  }
  return true
}

export async function GET(request: Request) {
  if (!(await requireSuperAdmin())) return new NextResponse('Unauthorized', { status: 401 })
  const tenants = await prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(tenants)
}

export async function POST(request: Request) {
  if (!(await requireSuperAdmin())) return new NextResponse('Unauthorized', { status: 401 })
  try {
    const body = await request.json()
    const { name, ownerEmail, slug: rawSlug, password = 'Password@123' } = body
    if (!name || !ownerEmail) return NextResponse.json({ error: 'Name and ownerEmail are required' }, { status: 400 })
    
    const slug = normalizeSlug(rawSlug || name)
    if (isReservedSlug(slug) || slug.length < 3) {
      return NextResponse.json({ error: 'Invalid or reserved slug' }, { status: 400 })
    }
    
    const existing = await prisma.tenant.findUnique({ where: { slug } })
    if (existing) return NextResponse.json({ error: 'Slug already taken' }, { status: 400 })

    const hashed = await bcrypt.hash(password, 10)
    const tenant = await prisma.tenant.create({
      data: {
        slug,
        name,
        ownerEmail,
        status: 'active',
        adminUsers: { create: [{ email: ownerEmail, name: name, password: hashed, role: 'owner' }] },
      },
    })
    
    return NextResponse.json({ success: true, tenant })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  if (!(await requireSuperAdmin())) return new NextResponse('Unauthorized', { status: 401 })
  try {
    const body = await request.json()
    const { id, name, ownerEmail, status, slug: rawSlug } = body
    if (!id) return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 })

    const updateData: any = {}
    if (name) updateData.name = name
    if (ownerEmail) updateData.ownerEmail = ownerEmail
    if (status) updateData.status = status
    if (rawSlug) {
      const slug = normalizeSlug(rawSlug)
      if (isReservedSlug(slug) || slug.length < 3) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
      updateData.slug = slug
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: updateData,
    })
    
    return NextResponse.json({ success: true, tenant })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!(await requireSuperAdmin())) return new NextResponse('Unauthorized', { status: 401 })
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Tenant ID query parameter is required' }, { status: 400 })

    await prisma.tenant.delete({ where: { id } })
    
    return NextResponse.json({ success: true, message: 'Tenant deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
