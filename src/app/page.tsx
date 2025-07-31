'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, BarChart3, Calendar, Upload } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          // User is authenticated, redirect to dashboard
          router.push('/dashboard')
        }
      } catch (error) {
        // User is not authenticated, stay on landing page
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Lead Tracker
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Manage your leads efficiently with our comprehensive CRM solution.
            Track contacts, manage follow-ups, and convert more prospects into customers.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="lg" className="px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <CardTitle>Lead Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Organize and track all your leads in one place with detailed contact information and status tracking.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <CardTitle>Follow-ups</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Never miss an opportunity with automated follow-up reminders and scheduling.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-purple-600" />
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Track your conversion rates and performance with detailed analytics and reporting.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-orange-600" />
              <CardTitle>Bulk Import</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Import leads in bulk from CSV or Excel files to get started quickly.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to get started?</CardTitle>
              <CardDescription>
                Join thousands of businesses using Lead Tracker to manage their sales pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/signup">
                <Button size="lg" className="w-full">
                  Create Your Free Account
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
