'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, Calendar, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useDashboardStats } from '@/hooks/use-dashboard'

export default function DashboardPage() {
  const { data: stats, isLoading: loading, error } = useDashboardStats()

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p>Failed to load dashboard data. {error?.message}</p>
      </div>
    )
  }

  const { overview } = stats

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here&apos;s what&apos;s happening with your leads.</p>
        </div>
        <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200 px-3 py-1">
          📈 {overview.conversionRate}% conversion rate
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-gray-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Leads</CardTitle>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{overview.totalLeads}</div>
            <p className="text-sm text-gray-600 mt-1">
              +{overview.leadsThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">New Leads</CardTitle>
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{overview.newLeads}</div>
            <p className="text-sm text-gray-600 mt-1">
              +{overview.leadsThisWeek} this week
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Converted</CardTitle>
            <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{overview.convertedLeads}</div>
            <p className="text-sm text-gray-600 mt-1">
              {overview.conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Follow-ups</CardTitle>
            <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Calendar className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{overview.upcomingFollowUps}</div>
            <p className="text-sm text-gray-600 mt-1">
              upcoming tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Lead Status Pie Chart */}
        <Card className="shadow-sm border-gray-200 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Lead Status Distribution</CardTitle>
            <CardDescription className="text-gray-600">Current breakdown of lead statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'New', value: overview.newLeads, color: '#3b82f6' },
                      { name: 'Contacted', value: overview.contactedLeads, color: '#6b7280' },
                      { name: 'Interested', value: overview.interestedLeads, color: '#eab308' },
                      { name: 'Converted', value: overview.convertedLeads, color: '#22c55e' },
                      { name: 'Lost', value: overview.lostLeads, color: '#ef4444' },
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'New', value: overview.newLeads, color: '#3b82f6' },
                      { name: 'Contacted', value: overview.contactedLeads, color: '#6b7280' },
                      { name: 'Interested', value: overview.interestedLeads, color: '#eab308' },
                      { name: 'Converted', value: overview.convertedLeads, color: '#22c55e' },
                      { name: 'Lost', value: overview.lostLeads, color: '#ef4444' },
                    ].filter(item => item.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Conversion Trend</CardTitle>
            <CardDescription>Monthly lead conversion over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.conversionChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="new" stroke="#3b82f6" name="New" />
                  <Line type="monotone" dataKey="converted" stroke="#22c55e" name="Converted" />
                  <Line type="monotone" dataKey="lost" stroke="#ef4444" name="Lost" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lead Status Breakdown</CardTitle>
            <CardDescription>Current distribution of lead statuses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">New</span>
              <Badge variant="secondary">{overview.newLeads}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Contacted</span>
              <Badge variant="outline">{overview.contactedLeads}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Interested</span>
              <Badge className="bg-yellow-500 text-white">{overview.interestedLeads}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Converted</span>
              <Badge className="bg-green-500 text-white">{overview.convertedLeads}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Lost</span>
              <Badge variant="destructive">{overview.lostLeads}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Summary of recent lead activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <p className="font-medium">This Month</p>
              <p className="text-muted-foreground">{overview.leadsThisMonth} new leads added</p>
            </div>
            <div className="text-sm">
              <p className="font-medium">This Week</p>
              <p className="text-muted-foreground">{overview.leadsThisWeek} new leads added</p>
            </div>
            <div className="text-sm">
              <p className="font-medium">Upcoming</p>
              <p className="text-muted-foreground">{overview.upcomingFollowUps} follow-ups scheduled</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
