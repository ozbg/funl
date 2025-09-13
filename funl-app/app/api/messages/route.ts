import { NextRequest, NextResponse } from 'next/server';
import { messageManager } from '@/lib/messaging';
import type { MessageFilters } from '@/lib/messaging';

// Helper function to get business ID from session/auth
// This will need to be implemented based on your auth system
async function getBusinessIdFromRequest(req: NextRequest): Promise<string | null> {
  // TODO: Implement based on your authentication system
  // For now, we'll extract from headers or query params
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

    // Parse query parameters for filtering
    const filters: MessageFilters = {};
    
    // Status filter
    const status = searchParams.getAll('status');
    if (status.length > 0) {
      filters.status = status as any[];
    }
    
    // Type filter
    const type = searchParams.getAll('type');
    if (type.length > 0) {
      filters.type = type as any[];
    }
    
    // Priority filter
    const priority = searchParams.getAll('priority');
    if (priority.length > 0) {
      filters.priority = priority as any[];
    }
    
    // Funnel filter
    const funnelId = searchParams.get('funnelId');
    if (funnelId) {
      filters.funnelId = funnelId;
    }
    
    // Date filters
    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom);
    }
    
    const dateTo = searchParams.get('dateTo');
    if (dateTo) {
      filters.dateTo = new Date(dateTo);
    }
    
    // Pagination
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    filters.limit = Math.min(limit, 100); // Cap at 100
    filters.offset = Math.max(offset, 0);
    
    // Search query
    const search = searchParams.get('search');
    
    let result;
    if (search) {
      result = await messageManager.searchMessages(businessId, search, filters);
    } else {
      result = await messageManager.getMessagesForBusiness(businessId, filters);
    }

    return NextResponse.json({
      data: result.messages,
      meta: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset
      }
    });

  } catch (error) {
    console.error('GET /api/messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    
    // Ensure businessId is set correctly
    const messageData = {
      ...body,
      businessId
    };

    const message = await messageManager.createMessage(messageData);

    return NextResponse.json(
      { data: message },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST /api/messages error:', error);
    
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