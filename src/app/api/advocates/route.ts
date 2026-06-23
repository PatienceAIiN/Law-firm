import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/advocates - List all advocates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const advocates = await prisma.advocate.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        title: true,
        bio: true,
        profileImage: true,
        phone: true,
        expertise: true,
        education: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { cases: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(advocates)
  } catch (error: any) {
    console.error('Advocates GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch advocates' },
      { status: 500 }
    )
  }
}

// POST /api/advocates - Create a new advocate
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.email || !data.password || !data.title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingAdvocate = await prisma.advocate.findFirst({
      where: { email: data.email },
    })

    if (existingAdvocate) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12)

    const advocate = await prisma.advocate.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        title: data.title,
        bio: data.bio,
        phone: data.phone,
        expertise: data.expertise,
        education: data.education,
        barCouncilId: data.barCouncilId,
        registrationDate: data.registrationDate ? new Date(data.registrationDate) : null,
        isActive: data.isActive !== false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        title: true,
        bio: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json(advocate, { status: 201 })
  } catch (error: any) {
    console.error('Advocates POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create advocate' },
      { status: 500 }
    )
  }
}
