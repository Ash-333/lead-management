import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current date for time-based queries
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))

    // Get basic counts
    const [
      totalLeads,
      newLeads,
      contactedLeads,
      interestedLeads,
      convertedLeads,
      lostLeads,
      leadsThisMonth,
      leadsThisWeek,
      upcomingFollowUps,
    ] = await Promise.all([
      // Total leads
      prisma.lead.count({
        where: { userId: user.userId },
      }),
      // Leads by status
      prisma.lead.count({
        where: { userId: user.userId, status: 'NEW' },
      }),
      prisma.lead.count({
        where: { userId: user.userId, status: 'CONTACTED' },
      }),
      prisma.lead.count({
        where: { userId: user.userId, status: 'INTERESTED' },
      }),
      prisma.lead.count({
        where: { userId: user.userId, status: 'CONVERTED' },
      }),
      prisma.lead.count({
        where: { userId: user.userId, status: 'LOST' },
      }),
      // Time-based counts
      prisma.lead.count({
        where: {
          userId: user.userId,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.lead.count({
        where: {
          userId: user.userId,
          createdAt: { gte: startOfWeek },
        },
      }),
      // Upcoming follow-ups
      prisma.followUp.count({
        where: {
          lead: { userId: user.userId },
          completed: false,
          dueDate: { gte: new Date() },
        },
      }),
    ])

    // Get conversion data for the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const conversionData = await prisma.lead.groupBy({
      by: ['status', 'createdAt'],
      where: {
        userId: user.userId,
        createdAt: { gte: sixMonthsAgo },
      },
      _count: true,
    })

    // Process conversion data by month
    interface MonthlyData {
      month: string;
      new: number;
      contacted: number;
      interested: number;
      converted: number;
      lost: number;
    }

    const monthlyData: { [key: string]: MonthlyData } = {}
    conversionData.forEach((item) => {
      const month = item.createdAt.toISOString().slice(0, 7) // YYYY-MM format
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          new: 0,
          contacted: 0,
          interested: 0,
          converted: 0,
          lost: 0,
        }
      }
      monthlyData[month][item.status.toLowerCase() as keyof Omit<MonthlyData, 'month'>] = item._count
    })

    const conversionChart = Object.values(monthlyData).sort((a: MonthlyData, b: MonthlyData) =>
      a.month.localeCompare(b.month)
    )

    // Calculate conversion rate
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

    const stats = {
      overview: {
        totalLeads,
        newLeads,
        contactedLeads,
        interestedLeads,
        convertedLeads,
        lostLeads,
        leadsThisMonth,
        leadsThisWeek,
        upcomingFollowUps,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      conversionChart,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
