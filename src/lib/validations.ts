import { z } from 'zod'

// Auth schemas
export const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Lead schemas
export const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  notes: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'LOST']).default('NEW'),
})

export const updateLeadSchema = leadSchema.partial()

// Note schemas
export const noteSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  leadId: z.string().min(1, 'Lead ID is required'),
})

// Follow-up schemas
export const followUpSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().datetime('Invalid date format'),
  leadId: z.string().min(1, 'Lead ID is required'),
})

export const updateFollowUpSchema = followUpSchema.partial().extend({
  completed: z.boolean().optional(),
})

// Bulk import schema
export const bulkLeadSchema = z.object({
  leads: z.array(leadSchema.omit({ status: true })),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type LeadInput = z.infer<typeof leadSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>
export type NoteInput = z.infer<typeof noteSchema>
export type FollowUpInput = z.infer<typeof followUpSchema>
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>
export type BulkLeadInput = z.infer<typeof bulkLeadSchema>
