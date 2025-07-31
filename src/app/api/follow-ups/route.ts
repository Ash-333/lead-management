import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { followUpSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = followUpSchema.parse(body)

    // Verify that the lead belongs to the user
    const lead = await prisma.lead.findFirst({
      where: {
        id: validatedData.leadId,
        userId: user.userId,
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const followUp = await prisma.followUp.create({
      data: {
        ...validatedData,
        dueDate: new Date(validatedData.dueDate),
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(followUp, { status: 201 })
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

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const upcoming = searchParams.get('upcoming') === 'true'

    const where: {
      lead: { userId: string };
      leadId?: string;
      completed?: boolean;
      dueDate?: { gte: Date };
    } = {
      lead: {
        userId: user.userId,
      },
    }

    if (leadId) {
      where.leadId = leadId
    }

    if (upcoming) {
      where.completed = false
      where.dueDate = {
        gte: new Date(),
      }
    }

    const followUps = await prisma.followUp.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(followUps)
  } catch (error) {
    console.error('Get follow-ups error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
