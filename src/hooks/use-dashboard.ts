import { useQuery } from '@tanstack/react-query'

interface DashboardStats {
  overview: {
    totalLeads: number
    newLeads: number
    contactedLeads: number
    interestedLeads: number
    convertedLeads: number
    lostLeads: number
    leadsThisMonth: number
    leadsThisWeek: number
    upcomingFollowUps: number
    conversionRate: number
  }
  conversionChart: Array<{
    month: string
    new: number
    contacted: number
    interested: number
    converted: number
    lost: number
  }>
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
