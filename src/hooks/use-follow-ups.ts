import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FollowUpInput, UpdateFollowUpInput } from '@/lib/validations'

interface FollowUp {
  id: string
  title: string
  description?: string
  dueDate: string
  completed: boolean
  createdAt: string
  updatedAt: string
  leadId: string
  lead: {
    id: string
    name: string
    email: string
  }
}

interface FollowUpParams {
  leadId?: string
  upcoming?: boolean
}

// Fetch follow-ups
export function useFollowUps(params: FollowUpParams = {}) {
  return useQuery({
    queryKey: ['follow-ups', params],
    queryFn: async (): Promise<FollowUp[]> => {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/follow-ups?${searchParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch follow-ups')
      }
      return response.json()
    },
  })
}

// Create follow-up mutation
export function useCreateFollowUp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: FollowUpInput): Promise<FollowUp> => {
      const response = await fetch('/api/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create follow-up')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

// Update follow-up mutation
export function useUpdateFollowUp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateFollowUpInput }): Promise<FollowUp> => {
      const response = await fetch(`/api/follow-ups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update follow-up')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

// Delete follow-up mutation
export function useDeleteFollowUp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/follow-ups/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete follow-up')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
