'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { leadSchema, type LeadInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FormField, FormLabel, FormMessage } from '@/components/ui/form'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Plus, Search, Filter, Edit, Trash2, Mail, Phone, Globe, MapPin, Users, Star, CheckCircle, XCircle, UserPlus, PhoneCall } from 'lucide-react'

interface Lead {
  id: string
  name: string
  location?: string
  phone?: string
  email?: string
  website?: string
  notes?: string
  source?: string
  status: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'CONVERTED' | 'LOST'
  createdAt: string
  updatedAt: string
  _count: {
    leadNotes: number
    followUps: number
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

const statusColors = {
  NEW: 'bg-blue-100 text-blue-800 border-blue-200',
  CONTACTED: 'bg-gray-100 text-gray-800 border-gray-200',
  INTERESTED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONVERTED: 'bg-green-100 text-green-800 border-green-200',
  LOST: 'bg-red-100 text-red-800 border-red-200',
}

const statusIcons = {
  NEW: <UserPlus className="h-3 w-3" />,
  CONTACTED: <PhoneCall className="h-3 w-3" />,
  INTERESTED: <Star className="h-3 w-3" />,
  CONVERTED: <CheckCircle className="h-3 w-3" />,
  LOST: <XCircle className="h-3 w-3" />,
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })

  const form = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      location: '',
      phone: '',
      email: '',
      website: '',
      notes: '',
      source: '',
    },
  })

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (sourceFilter) params.append('source', sourceFilter)
      if (searchTerm) params.append('search', searchTerm)
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())

      const response = await fetch(`/api/leads?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, sourceFilter, searchTerm, pagination.page, pagination.limit])

  useEffect(() => {
    // Reset to page 1 when filters change
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }))
    } else {
      fetchLeads()
    }
  }, [statusFilter, sourceFilter, searchTerm, fetchLeads, pagination.page])

  useEffect(() => {
    fetchLeads()
  }, [pagination.page, fetchLeads])

  const onSubmit = async (data: LeadInput) => {
    try {
      const url = editingLead ? `/api/leads/${editingLead.id}` : '/api/leads'
      const method = editingLead ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await fetchLeads()
        setIsCreateDialogOpen(false)
        setIsEditDialogOpen(false)
        setEditingLead(null)
        form.reset()
      }
    } catch (error) {
      console.error('Error saving lead:', error)
    }
  }

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead)
    form.reset({
      name: lead.name,
      location: lead.location || '',
      phone: lead.phone || '',
      email: lead.email,
      website: lead.website || '',
      notes: lead.notes || '',
      source: lead.source || '',
      status: lead.status,
    })
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchLeads()
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
    }
  }

  // Pagination functions
  const goToPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  // Handle records per page change
  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      page: 1 // Reset to first page when changing limit
    }))
  }

  // Server-side filtering is now handled in the API
  const filteredLeads = leads

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">
            Manage and track your sales leads through the entire pipeline.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-blue-600" />
            Filters
          </CardTitle>
          <CardDescription className="text-gray-600">
            Search and filter your leads to find exactly what you&apos;re looking for.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="INTERESTED">Interested</option>
                <option value="CONVERTED">Converted</option>
                <option value="LOST">Lost</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Source</label>
              <Input
                placeholder="Filter by source..."
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Leads ({pagination.total})
              </CardTitle>
              <CardDescription className="text-gray-600">
                Manage your leads and track their progress through the sales pipeline.
              </CardDescription>
            </div>
            {pagination.total > 0 && (
              <div className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg border border-gray-200 mx-6 mb-6">
              <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Users className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {searchTerm || statusFilter || sourceFilter
                  ? "No leads found"
                  : "No leads yet"
                }
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm || statusFilter || sourceFilter
                  ? "Try adjusting your search or filter criteria to find the leads you&apos;re looking for."
                  : "Start building your sales pipeline by adding your first lead. Track their progress and never miss a follow-up."
                }
              </p>
              {!searchTerm && !statusFilter && !sourceFilter && (
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 text-base font-medium"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Your First Lead
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
              <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="min-w-[180px] font-semibold text-gray-900 py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-600" />
                      Lead Details
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[140px] font-semibold text-gray-900 py-4 px-4">Contact Info</TableHead>
                  <TableHead className="min-w-[180px] font-semibold text-gray-900 py-4 px-4">Business Details</TableHead>
                  <TableHead className="min-w-[120px] font-semibold text-gray-900 py-4 px-4">Status</TableHead>
                  <TableHead className="text-right min-w-[120px] font-semibold text-gray-900 py-4 px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead, index) => (
                  <TableRow key={lead.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    {/* Lead Details Column */}
                    <TableCell className="py-6 px-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-base">{lead.name}</div>
                            <div className="text-sm text-gray-500">
                              {lead._count.leadNotes || 0} notes • {lead._count.followUps} follow-ups
                            </div>
                          </div>
                        </div>
                        {lead.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 ml-13">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{lead.location}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Contact Info Column */}
                    <TableCell className="py-6 px-4">
                      <div className="space-y-3">
                        {lead.phone && (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Phone className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{lead.phone}</div>
                              <div className="text-xs text-gray-500">Phone</div>
                            </div>
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Mail className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{lead.email}</div>
                              <div className="text-xs text-gray-500">Email</div>
                            </div>
                          </div>
                        )}
                        {!lead.phone && !lead.email && (
                          <div className="text-sm text-gray-400 italic">No contact info</div>
                        )}
                      </div>
                    </TableCell>

                    {/* Business Details Column */}
                    <TableCell className="py-6 px-4">
                      <div className="space-y-3">
                        {lead.website && (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Globe className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <a
                                href={lead.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[140px] block"
                              >
                                {lead.website.replace(/^https?:\/\//, '')}
                              </a>
                              <div className="text-xs text-gray-500">Website</div>
                            </div>
                          </div>
                        )}
                        {lead.source && (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 bg-orange-100 rounded-md flex items-center justify-center">
                              <span className="text-xs font-medium text-orange-600">S</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-700">{lead.source}</div>
                              <div className="text-xs text-gray-500">Source</div>
                            </div>
                          </div>
                        )}
                        {lead.notes && (
                          <div className="text-xs text-gray-600 bg-gray-50 rounded-md p-2 max-w-[160px]">
                            <div className="truncate">{lead.notes}</div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {/* Status Column */}
                    <TableCell className="py-6 px-4">
                      <div className="flex flex-col items-start gap-2">
                        <Badge className={`${statusColors[lead.status]} border-0 font-medium px-3 py-1.5 text-xs flex items-center gap-1.5`}>
                          {statusIcons[lead.status]}
                          {lead.status}
                        </Badge>
                        {lead.source && (
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                            <span className="text-xs text-gray-500">{lead.source}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell className="text-right py-6 px-6">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(lead)}
                          className="h-9 w-9 p-0 border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                          title="Edit lead"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(lead.id)}
                          className="h-9 w-9 p-0 border-gray-200 hover:border-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                          title="Delete lead"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredLeads.length > 0 && (
            <Pagination
              pagination={pagination}
              onPageChange={goToPage}
              onLimitChange={handleLimitChange}
              itemName="leads"
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false)
            setIsEditDialogOpen(false)
            setEditingLead(null)
            form.reset()
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">
              {editingLead ? 'Edit Lead' : 'Add New Lead'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {editingLead ? 'Update the lead information below.' : 'Fill in the details to create a new lead.'}
            </p>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            {/* Basic Information Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900 border-b pb-1">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField>
                  <FormLabel htmlFor="name" className="text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <Input
                    id="name"
                    placeholder="Enter lead name"
                    className="mt-1"
                    {...form.register('name')}
                  />
                  {form.formState.errors.name && (
                    <FormMessage>{form.formState.errors.name.message}</FormMessage>
                  )}
                </FormField>

                <FormField>
                  <FormLabel htmlFor="location" className="text-sm font-medium text-gray-700">
                    Location
                  </FormLabel>
                  <Input
                    id="location"
                    placeholder="City, State, Country"
                    className="mt-1"
                    {...form.register('location')}
                  />
                </FormField>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900 border-b pb-1">Contact Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField>
                  <FormLabel htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone
                  </FormLabel>
                  <Input
                    id="phone"
                    placeholder="+1 (555) 123-4567"
                    className="mt-1"
                    {...form.register('phone')}
                  />
                </FormField>

                <FormField>
                  <FormLabel htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </FormLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@example.com"
                    className="mt-1"
                    {...form.register('email')}
                  />
                  {form.formState.errors.email && (
                    <FormMessage>{form.formState.errors.email.message}</FormMessage>
                  )}
                </FormField>
              </div>

              <FormField>
                <FormLabel htmlFor="website" className="text-sm font-medium text-gray-700">
                  Website
                </FormLabel>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  className="mt-1"
                  {...form.register('website')}
                />
                {form.formState.errors.website && (
                  <FormMessage>{form.formState.errors.website.message}</FormMessage>
                )}
              </FormField>
            </div>

            {/* Lead Details Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900 border-b pb-1">Lead Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField>
                  <FormLabel htmlFor="source" className="text-sm font-medium text-gray-700">
                    Source
                  </FormLabel>
                  <Input
                    id="source"
                    placeholder="Website, Referral, Cold Call, etc."
                    className="mt-1"
                    {...form.register('source')}
                  />
                </FormField>

                <FormField>
                  <FormLabel htmlFor="status" className="text-sm font-medium text-gray-700">
                    Status
                  </FormLabel>
                  <Select {...form.register('status')} className="mt-1">
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="INTERESTED">Interested</option>
                    <option value="CONVERTED">Converted</option>
                    <option value="LOST">Lost</option>
                  </Select>
                </FormField>
              </div>

              <FormField>
                <FormLabel htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Notes
                </FormLabel>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Add any additional notes about this lead..."
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  {...form.register('notes')}
                />
              </FormField>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                {editingLead ? '💾 Update Lead' : '✨ Create Lead'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="px-6"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  setIsEditDialogOpen(false)
                  setEditingLead(null)
                  form.reset()
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
