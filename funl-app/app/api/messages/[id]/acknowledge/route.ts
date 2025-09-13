import { NextRequest, NextResponse } from 'next/server';
import { messageManager } from '@/lib/messaging';

// Helper function to get business ID from session/auth
async function getBusinessIdFromRequest(req: NextRequest): Promise<string | null> {
  // TODO: Implement based on your authentication system
  const businessId = req.headers.get('x-business-id') || 
                    new URL(req.url).searchParams.get('businessId');
  return businessId;
}

export async function POST(
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

    // Check if already acknowledged
    if (existingMessage.status === 'acknowledged') {
      return NextResponse.json(
        { error: 'Message already acknowledged' },
        { status: 400 }
      );
    }

    const message = await messageManager.acknowledgeMessage(resolvedParams.id, businessId);

    return NextResponse.json({ data: message });

  } catch (error) {
    console.error('POST /api/messages/[id]/acknowledge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}