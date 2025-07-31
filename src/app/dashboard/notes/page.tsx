'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { noteSchema, type NoteInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'

import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormField, FormLabel, FormMessage } from '@/components/ui/form'
import { Plus, Trash2, MessageSquare } from 'lucide-react'

interface Lead {
  id: string
  name: string
  email: string
}

interface Note {
  id: string
  content: string
  createdAt: string
  leadId: string
  lead?: Lead
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState('')

  const form = useForm<NoteInput>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      content: '',
      leadId: '',
    },
  })

  useEffect(() => {
    fetchLeads()
    fetchAllNotes()
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

  const fetchAllNotes = async () => {
    try {
      // Since we need notes from all leads, we'll fetch them per lead
      const response = await fetch('/api/leads?limit=100')
      if (response.ok) {
        const data = await response.json()
        const allNotes: Note[] = []
        
        // Collect all notes from all leads
        for (const lead of data.leads) {
          if (lead.leadNotes && lead.leadNotes.length > 0) {
            lead.leadNotes.forEach((note: { id: string; content: string; createdAt: string }) => {
              allNotes.push({
                ...note,
                leadId: lead.id,
                lead: {
                  id: lead.id,
                  name: lead.name,
                  email: lead.email,
                }
              })
            })
          }
        }
        
        // Sort by creation date (newest first)
        allNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setNotes(allNotes)
      }
    } catch (error) {
      // Error fetching notes - handle silently in production
    } finally {
      setLoading(false)
    }
  }

  const fetchNotesForLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/notes?leadId=${leadId}`)
      if (response.ok) {
        const data = await response.json()
        return data
      }
    } catch (error) {
      // Error fetching notes for lead - handle silently in production
    }
    return []
  }

  const onSubmit = async (data: NoteInput) => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await fetchAllNotes()
        setIsCreateDialogOpen(false)
        form.reset()
      }
    } catch (error) {
      // Error creating note - handle silently in production
    }
  }

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchAllNotes()
      }
    } catch (error) {
      // Error deleting note - handle silently in production
    }
  }

  const filteredNotes = selectedLeadId 
    ? notes.filter(note => note.leadId === selectedLeadId)
    : notes

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notes</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Filter by Lead</label>
              <Select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
              >
                <option value="">All Leads</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} ({lead.email})
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      <div className="space-y-4">
        {loading ? (
          <p>Loading notes...</p>
        ) : filteredNotes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No notes found.</p>
            </CardContent>
          </Card>
        ) : (
          filteredNotes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {note.lead?.name || 'Unknown Lead'}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        ({note.lead?.email || 'No email'})
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {note.content}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Note Dialog */}
      <Dialog 
        open={isCreateDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false)
            form.reset()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Note</DialogTitle>
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
              <FormLabel htmlFor="content">Note Content</FormLabel>
              <textarea
                id="content"
                rows={4}
                placeholder="Enter your note..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...form.register('content')}
              />
              {form.formState.errors.content && (
                <FormMessage>{form.formState.errors.content.message}</FormMessage>
              )}
            </FormField>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Create Note
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
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
