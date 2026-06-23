import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/advocates/[id] - Get advocate details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const advocate = await prisma.advocate.findUnique({
      where: { id },
      include: {
        cases: {
          select: { id: true, caseNumber: true, title: true, status: true },
          take: 5,
        },
        _count: {
          select: { cases: true, accessLogs: true },
        },
      },
    })

    if (!advocate) {
      return NextResponse.json({ error: 'Advocate not found' }, { status: 404 })
    }

    // Remove password from response
    const { password, ...advocateData } = advocate as any
    return NextResponse.json(advocateData)
  } catch (error: any) {
    console.error('Advocate GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch advocate' },
      { status: 500 }
    )
  }
}

// PUT /api/advocates/[id] - Update advocate
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { id } = await params

    // Check if email is already taken by another advocate
    if (data.email) {
      const existing = await prisma.advocate.findFirst({
        where: { email: data.email },
      })

      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        )
      }
    }

    // Hash password if provided
    let updateData: any = {
      name: data.name,
      email: data.email,
      title: data.title,
      bio: data.bio,
      phone: data.phone,
      expertise: data.expertise,
      education: data.education,
      barCouncilId: data.barCouncilId,
      registrationDate: data.registrationDate ? new Date(data.registrationDate) : null,
      isActive: data.isActive,
    }

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12)
    }

    const advocate = await prisma.advocate.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        title: true,
        bio: true,
        phone: true,
        isActive: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(advocate)
  } catch (error: any) {
    console.error('Advocate PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update advocate' },
      { status: 500 }
    )
  }
}

// DELETE /api/advocates/[id] - Delete advocate
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    // Unassign advocate from all cases
    await prisma.courtCase.updateMany({
      where: { advocateId: id },
      data: { advocateId: null },
    })

    // Delete advocate
    await prisma.advocate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Advocate DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete advocate' },
      { status: 500 }
    )
  }
}
