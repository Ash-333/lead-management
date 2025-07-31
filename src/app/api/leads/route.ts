import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { leadSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: {
      userId: string;
      status?: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'CONVERTED' | 'LOST';
      source?: { contains: string; mode: 'insensitive' };
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
        phone?: { contains: string; mode: 'insensitive' };
      }>;
    } = {
      userId: user.userId,
    }

    if (status && ['NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'LOST'].includes(status)) {
      where.status = status as 'NEW' | 'CONTACTED' | 'INTERESTED' | 'CONVERTED' | 'LOST'
    }

    if (source) {
      where.source = {
        contains: source,
        mode: 'insensitive',
      }
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          }
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          }
        },
        {
          phone: {
            contains: search,
            mode: 'insensitive',
          }
        }
      ]
    }

    // Get leads with pagination
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
        include: {
          leadNotes: {
            orderBy: { createdAt: 'desc' },
            take: 3, // Include latest 3 notes
          },
          followUps: {
            where: { completed: false },
            orderBy: { dueDate: 'asc' },
            take: 1, // Include next upcoming follow-up
          },
          _count: {
            select: {
              leadNotes: true,
              followUps: true,
            },
          },
        },
      }),
      prisma.lead.count({ where }),
    ])

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = leadSchema.parse(body)

    // Check if lead with same email already exists for this user (only if email is provided)
    if (validatedData.email && validatedData.email.trim() !== '') {
      const existingLead = await prisma.lead.findFirst({
        where: {
          userId: user.userId,
          email: validatedData.email,
        },
      })

      if (existingLead) {
        return NextResponse.json(
          { error: 'Lead with this email already exists' },
          { status: 400 }
        )
      }
    }

    const lead = await prisma.lead.create({
      data: {
        ...validatedData,
        userId: user.userId,
      },
      include: {
        leadNotes: true,
        followUps: true,
        _count: {
          select: {
            leadNotes: true,
            followUps: true,
          },
        },
      },
    })

    return NextResponse.json(lead, { status: 201 })
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
