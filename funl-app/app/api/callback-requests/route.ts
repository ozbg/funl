import { NextRequest, NextResponse } from 'next/server';
import { messageManager } from '@/lib/messaging';
import { z } from 'zod';

const CallbackRequestSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  phone: z.string().min(1, 'Phone is required').regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Invalid phone number'),
  preferred_time: z.string().optional(),
  message: z.string().max(1000, 'Message too long').optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request data
    const validated = CallbackRequestSchema.parse(body);
    
    // Get funnel and business info from database
    // Use service role client to bypass RLS for public callback requests
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, name, business_id')
      .eq('id', validated.funnelId)
      .single();
    
    if (funnelError || !funnel) {
      console.error('Funnel lookup failed:', { 
        funnelId: validated.funnelId, 
        error: funnelError,
        funnel 
      });
      return NextResponse.json(
        { error: 'Funnel not found', funnelId: validated.funnelId },
        { status: 404 }
      );
    }

    // Create message using the messaging system
    const messageData = {
      funnelId: validated.funnelId,
      businessId: funnel.business_id,
      type: 'callback_request' as const,
      contactName: validated.name,
      contactPhone: validated.phone,
      contactEmail: undefined, // Not collected in current form
      subject: undefined,
      message: [
        `Name: ${validated.name}`,
        `Phone: ${validated.phone}`,
        validated.preferred_time ? `Preferred time: ${validated.preferred_time}` : '',
        validated.message ? `Message: ${validated.message}` : ''
      ].filter(Boolean).join('\n'),
      priority: 'medium' as const,
      metadata: {
        source: 'public_funnel',
        preferred_time: validated.preferred_time,
        original_message: validated.message
      }
    };

    const message = await messageManager.createMessage(messageData);

    // Also create a record in the legacy callback_requests table for backwards compatibility
    const { error: callbackError } = await supabase
      .from('callback_requests')
      .insert({
        funnel_id: validated.funnelId,
        name: validated.name,
        phone: validated.phone,
        preferred_time: validated.preferred_time,
        message: validated.message,
        status: 'pending'
      });

    if (callbackError) {
      console.warn('Failed to create legacy callback request record:', callbackError);
      // Don't fail the request for this - the message was created successfully
    }

    return NextResponse.json({
      success: true,
      message: 'Callback request submitted successfully',
      data: {
        id: message.id,
        status: 'pending'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/callback-requests error:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.issues.map((e) => ({ field: e.path.map(String).join('.'), message: e.message }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}