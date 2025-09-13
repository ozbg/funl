import { NextRequest, NextResponse } from 'next/server';
import { messageManager } from '@/lib/messaging';

// Helper function to get business ID from session/auth
async function getBusinessIdFromRequest(req: NextRequest): Promise<string | null> {
  // TODO: Implement based on your authentication system
  const businessId = req.headers.get('x-business-id') || 
                    new URL(req.url).searchParams.get('businessId');
  return businessId;
}

export async function GET(req: NextRequest) {
  try {
    const businessId = await getBusinessIdFromRequest(req);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // Parse date range for analytics
    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;

    const dateFromParam = searchParams.get('dateFrom');
    if (dateFromParam) {
      dateFrom = new Date(dateFromParam);
    }

    const dateToParam = searchParams.get('dateTo');
    if (dateToParam) {
      dateTo = new Date(dateToParam);
    }

    // Default to last 30 days if no date range provided
    if (!dateFrom && !dateTo) {
      dateTo = new Date();
      dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 30);
    }

    const analytics = await messageManager.getMessageAnalytics(
      businessId,
      dateFrom,
      dateTo
    );

    return NextResponse.json({ data: analytics });

  } catch (error) {
    console.error('GET /api/messages/analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}