import { NextRequest, NextResponse } from 'next/server';
import { messageManager } from '@/lib/messaging';

// Helper function to get business ID from session/auth
async function getBusinessIdFromRequest(req: NextRequest): Promise<string | null> {
  // TODO: Implement based on your authentication system
  const businessId = req.headers.get('x-business-id') || 
                    new URL(req.url).searchParams.get('businessId');
  return businessId;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const businessId = await getBusinessIdFromRequest(req);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const message = await messageManager.getMessageById(resolvedParams.id);

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Ensure user owns this message
    if (message.businessId !== businessId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: message });

  } catch (error) {
    console.error('GET /api/messages/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const businessId = await getBusinessIdFromRequest(req);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First check if message exists and user owns it
    const existingMessage = await messageManager.getMessageById(resolvedParams.id);
    
    if (!existingMessage) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (existingMessage.businessId !== businessId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const message = await messageManager.updateMessage(resolvedParams.id, body);

    return NextResponse.json({ data: message });

  } catch (error) {
    console.error('PATCH /api/messages/[id] error:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const businessId = await getBusinessIdFromRequest(req);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First check if message exists and user owns it
    const existingMessage = await messageManager.getMessageById(resolvedParams.id);
    
    if (!existingMessage) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (existingMessage.businessId !== businessId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await messageManager.deleteMessage(resolvedParams.id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('DELETE /api/messages/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}