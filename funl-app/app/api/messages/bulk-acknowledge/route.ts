import { NextRequest, NextResponse } from 'next/server';
import { messageManager } from '@/lib/messaging';
import { z } from 'zod';

// Helper function to get business ID from session/auth
async function getBusinessIdFromRequest(req: NextRequest): Promise<string | null> {
  // TODO: Implement based on your authentication system
  const businessId = req.headers.get('x-business-id') || 
                    new URL(req.url).searchParams.get('businessId');
  return businessId;
}

const BulkAcknowledgeSchema = z.object({
  messageIds: z.array(z.string().uuid()).min(1, 'At least one message ID required').max(100, 'Too many messages')
});

export async function POST(req: NextRequest) {
  try {
    const businessId = await getBusinessIdFromRequest(req);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Validate request body
    const { messageIds } = BulkAcknowledgeSchema.parse(body);

    // Verify all messages belong to this business (security check)
    const verificationPromises = messageIds.map(async (id) => {
      const message = await messageManager.getMessageById(id);
      if (!message || message.businessId !== businessId) {
        throw new Error(`Message ${id} not found or access denied`);
      }
      return message;
    });

    await Promise.all(verificationPromises);

    // Acknowledge all messages
    await messageManager.acknowledgeMessages(businessId, messageIds);

    return NextResponse.json({ 
      success: true,
      acknowledgedCount: messageIds.length
    });

  } catch (error) {
    console.error('POST /api/messages/bulk-acknowledge error:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('not found or access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}