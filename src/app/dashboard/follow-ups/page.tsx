'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { followUpSchema, type FollowUpInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormField, FormLabel, FormMessage } from '@/components/ui/form'
import { Plus, Calendar, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react'

interface Lead {
  id: string
  name: string
  email: string
}

interface FollowUp {
  id: string
  title: string
  description?: string
  dueDate: string
  completed: boolean
  createdAt: string
  updatedAt: string
  leadId: string
  lead: Lead
}

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('pending')

  const form = useForm<FollowUpInput>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: '',
      leadId: '',
    },
  })

  useEffect(() => {
    fetchLeads()
    fetchFollowUps()
  }, [])

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads?limit=100')
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads)
      }
    } catch (error) {
      // Error fetching leads - handle silently in production
    }
  }

  const fetchFollowUps = async () => {
    try {
      const response = await fetch('/api/follow-ups')
      if (response.ok) {
        const data = await response.json()
        setFollowUps(data)
      }
    } catch (error) {
      // Error fetching follow-ups - handle silently in production
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: FollowUpInput) => {
    try {
      const url = editingFollowUp ? `/api/follow-ups/${editingFollowUp.id}` : '/api/follow-ups'
      const method = editingFollowUp ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await fetchFollowUps()
        setIsCreateDialogOpen(false)
        setIsEditDialogOpen(false)
        setEditingFollowUp(null)
        form.reset()
      }
    } catch (error) {
      // Error saving follow-up - handle silently in production
    }
  }

  const handleEdit = (followUp: FollowUp) => {
    setEditingFollowUp(followUp)
    form.reset({
      title: followUp.title,
      description: followUp.description || '',
      dueDate: new Date(followUp.dueDate).toISOString().slice(0, 16),
      leadId: followUp.leadId,
    })
    setIsEditDialogOpen(true)
  }

  const handleComplete = async (followUpId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/follow-ups/${followUpId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      })

      if (response.ok) {
        await fetchFollowUps()
      }
    } catch (error) {
      // Error updating follow-up - handle silently in production
    }
  }

  const handleDelete = async (followUpId: string) => {
    if (!confirm('Are you sure you want to delete this follow-up?')) return

    try {
      const response = await fetch(`/api/follow-ups/${followUpId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchFollowUps()
      }
    } catch (error) {
      // Error deleting follow-up - handle silently in production
    }
  }

  const getFilteredFollowUps = () => {
    const now = new Date()
    
    return followUps.filter(followUp => {
      const dueDate = new Date(followUp.dueDate)
      
      switch (filter) {
        case 'pending':
          return !followUp.completed && dueDate >= now
        case 'completed':
          return followUp.completed
        case 'overdue':
          return !followUp.completed && dueDate < now
        default:
          return true
      }
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }

  const getFollowUpStatus = (followUp: FollowUp) => {
    if (followUp.completed) return 'completed'
    const now = new Date()
    const dueDate = new Date(followUp.dueDate)
    return dueDate < now ? 'overdue' : 'pending'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white">Completed</Badge>
      case 'overdue':
        return <Badge className="bg-red-500 text-white">Overdue</Badge>
      case 'pending':
        return <Badge className="bg-blue-500 text-white">Pending</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const filteredFollowUps = getFilteredFollowUps()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Follow-ups</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Follow-up
        </Button>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Follow-ups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[
              { key: 'pending', label: 'Pending', count: followUps.filter(f => !f.completed && new Date(f.dueDate) >= new Date()).length },
              { key: 'overdue', label: 'Overdue', count: followUps.filter(f => !f.completed && new Date(f.dueDate) < new Date()).length },
              { key: 'completed', label: 'Completed', count: followUps.filter(f => f.completed).length },
              { key: 'all', label: 'All', count: followUps.length },
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={filter === tab.key ? 'default' : 'outline'}
                onClick={() => setFilter(tab.key as 'pending' | 'overdue' | 'completed' | 'all')}
                className="flex items-center gap-2"
              >
                {tab.label}
                <Badge variant="secondary">{tab.count}</Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Follow-ups List */}
      <div className="space-y-4">
        {loading ? (
          <p>Loading follow-ups...</p>
        ) : filteredFollowUps.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No follow-ups found for the selected filter.</p>
            </CardContent>
          </Card>
        ) : (
          filteredFollowUps.map((followUp) => {
            const status = getFollowUpStatus(followUp)
            return (
              <Card key={followUp.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{followUp.title}</h3>
                        {getStatusBadge(status)}
                      </div>
                      {followUp.description && (
                        <p className="text-gray-700">{followUp.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(followUp.dueDate).toLocaleString()}
                        </div>
                        <div>
                          Lead: {followUp.lead.name} ({followUp.lead.email})
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!followUp.completed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleComplete(followUp.id, true)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {followUp.completed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleComplete(followUp.id, false)}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(followUp)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(followUp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={isCreateDialogOpen || isEditDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false)
            setIsEditDialogOpen(false)
            setEditingFollowUp(null)
            form.reset()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFollowUp ? 'Edit Follow-up' : 'Add New Follow-up'}
            </DialogTitle>
          </DialogHeader>
          <Form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField>
              <FormLabel htmlFor="leadId">Lead</FormLabel>
              <Select {...form.register('leadId')}>
                <option value="">Select a lead</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} ({lead.email})
                  </option>
                ))}
              </Select>
              {form.formState.errors.leadId && (
                <FormMessage>{form.formState.errors.leadId.message}</FormMessage>
              )}
            </FormField>

            <FormField>
              <FormLabel htmlFor="title">Title</FormLabel>
              <Input
                id="title"
                placeholder="Enter follow-up title"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <FormMessage>{form.formState.errors.title.message}</FormMessage>
              )}
            </FormField>

            <FormField>
              <FormLabel htmlFor="description">Description (Optional)</FormLabel>
              <textarea
                id="description"
                rows={3}
                placeholder="Enter description..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...form.register('description')}
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="dueDate">Due Date</FormLabel>
              <Input
                id="dueDate"
                type="datetime-local"
                {...form.register('dueDate')}
              />
              {form.formState.errors.dueDate && (
                <FormMessage>{form.formState.errors.dueDate.message}</FormMessage>
              )}
            </FormField>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingFollowUp ? 'Update Follow-up' : 'Create Follow-up'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  setIsEditDialogOpen(false)
                  setEditingFollowUp(null)
                  form.reset()
                }}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
