import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { updateFollowUpSchema } from '@/lib/validations'

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
    const validatedData = updateFollowUpSchema.parse(body)

    // Find the follow-up and verify it belongs to a lead owned by the user
    const followUp = await prisma.followUp.findFirst({
      where: {
        id: params.id,
        lead: {
          userId: user.userId,
        },
      },
    })

    if (!followUp) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 })
    }

    const updateData: {
      title?: string;
      description?: string;
      dueDate?: Date;
      completed?: boolean;
    } = {
      title: validatedData.title,
      description: validatedData.description,
      completed: validatedData.completed,
    }
    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate)
    }

    const updatedFollowUp = await prisma.followUp.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(updatedFollowUp)
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

    // Find the follow-up and verify it belongs to a lead owned by the user
    const followUp = await prisma.followUp.findFirst({
      where: {
        id: params.id,
        lead: {
          userId: user.userId,
        },
      },
    })

    if (!followUp) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 })
    }

    await prisma.followUp.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Follow-up deleted successfully' })
  } catch (error) {
    console.error('Delete follow-up error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
