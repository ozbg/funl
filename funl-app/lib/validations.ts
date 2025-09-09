import { z } from 'zod'

export const CreateFunnelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  type: z.enum(['contact', 'property', 'video']),
  content: z.object({
    headline: z.string().max(200, 'Headline too long').optional(),
    state: z.enum(['for_sale', 'sold', 'coming_soon']).optional(),
    price: z.string().max(50, 'Price too long').optional(),
    property_url: z.string().url('Invalid URL').optional().or(z.literal('')),
    video_url: z.string().url('Invalid URL').optional().or(z.literal('')),
    custom_message: z.string().max(500, 'Message too long').optional(),
    cta_button_text: z.string().max(50, 'CTA text too long').optional(),
  }).optional(),
  print_size: z.enum(['A4', 'A5']).default('A4'),
})

export const UpdateFunnelSchema = CreateFunnelSchema.partial().extend({
  status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
})

export const CallbackRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  phone: z.string().min(1, 'Phone is required').max(20, 'Phone too long'),
  preferred_time: z.string().max(100, 'Time preference too long').optional(),
  message: z.string().max(500, 'Message too long').optional(),
})

export const VCardSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  organization: z.string().min(1, 'Organization is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }).optional(),
})

export type CreateFunnelInput = z.infer<typeof CreateFunnelSchema>
export type UpdateFunnelInput = z.infer<typeof UpdateFunnelSchema>
export type CallbackRequestInput = z.infer<typeof CallbackRequestSchema>
export type VCardInput = z.infer<typeof VCardSchema>