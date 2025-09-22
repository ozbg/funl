import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UpdateBusinessSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  type: z.enum(['individual', 'agency']),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color format'),
  vcard_data: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    organization: z.string().min(1, 'Organization is required'),
    phone: z.string().min(1, 'Phone is required'),
    email: z.string().email('Invalid email'),
    website: z.string().url().optional().or(z.literal('')),
  })
})

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Validate the request data
    const validatedData = UpdateBusinessSchema.parse(body)

    // Update the business record
    const { data, error } = await supabase
      .from('businesses')
      .update({
        name: validatedData.name,
        type: validatedData.type,
        phone: validatedData.phone || null,
        website: validatedData.website || null,
        accent_color: validatedData.accent_color,
        vcard_data: validatedData.vcard_data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update business settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Settings update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}