import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { advocateAuthOptions } from '@/lib/advocate-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(advocateAuthOptions)
  const id = session?.user?.id
  if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const data: any = {}
  for (const k of ['name', 'title', 'bio', 'phone', 'expertise', 'education', 'profileImage', 'barCouncilId']) {
    if (typeof body[k] === 'string') data[k] = body[k]
  }
  if (!data.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const advocate = await prisma.advocate.update({ where: { id }, data })
  return NextResponse.json({ success: true, advocate: { name: advocate.name, title: advocate.title } })
}
