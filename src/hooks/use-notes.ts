import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NoteInput } from '@/lib/validations'

interface Note {
  id: string
  content: string
  createdAt: string
  leadId: string
  lead?: {
    id: string
    name: string
    email: string
  }
}

// Fetch notes for a specific lead
export function useNotes(leadId?: string) {
  return useQuery({
    queryKey: ['notes', leadId],
    queryFn: async (): Promise<Note[]> => {
      const params = leadId ? `?leadId=${leadId}` : ''
      const response = await fetch(`/api/notes${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch notes')
      }
      return response.json()
    },
    enabled: !!leadId,
  })
}

// Create note mutation
export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: NoteInput): Promise<Note> => {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create note')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes', variables.leadId] })
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] })
    },
  })
}

// Delete note mutation
export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete note')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}
