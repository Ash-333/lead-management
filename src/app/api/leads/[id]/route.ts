import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { updateLeadSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
      include: {
        leadNotes: {
          orderBy: { createdAt: 'desc' },
        },
        followUps: {
          orderBy: { dueDate: 'asc' },
        },
        _count: {
          select: {
            leadNotes: true,
            followUps: true,
          },
        },
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Get lead error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateLeadSchema.parse(body)

    // Check if lead exists and belongs to user
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
    })

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // If email is being updated, check for duplicates (only if email is provided and not empty)
    if (validatedData.email && validatedData.email.trim() !== '' && validatedData.email !== existingLead.email) {
      const duplicateLead = await prisma.lead.findFirst({
        where: {
          userId: user.userId,
          email: validatedData.email,
          id: { not: params.id },
        },
      })

      if (duplicateLead) {
        return NextResponse.json(
          { error: 'Lead with this email already exists' },
          { status: 400 }
        )
      }
    }

    const updatedLead = await prisma.lead.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        leadNotes: {
          orderBy: { createdAt: 'desc' },
        },
        followUps: {
          orderBy: { dueDate: 'asc' },
        },
        _count: {
          select: {
            leadNotes: true,
            followUps: true,
          },
        },
      },
    })

    return NextResponse.json(updatedLead)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if lead exists and belongs to user
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
    })

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    await prisma.lead.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Lead deleted successfully' })
  } catch (error) {
    console.error('Delete lead error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
