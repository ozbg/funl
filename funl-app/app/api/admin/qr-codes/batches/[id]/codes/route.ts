import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params
  try {
    // Require admin authentication
    await requireAdmin()

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortBy = searchParams.get('sort') || 'created_at'
    const sortOrder = searchParams.get('order') || 'desc'

    // Build the base query
    let query = supabase
      .from('reserved_codes')
      .select(`
        id,
        code,
        status,
        business_id,
        funnel_id,
        assigned_at,
        updated_at,
        created_at,
        businesses!left(id, name, email, type),
        funnels!left(id, name, status, type)
      `, { count: 'exact' })
      .eq('batch_id', id)

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      // Search in code or business name
      query = query.or(`code.ilike.%${search}%,businesses.name.ilike.%${search}%`)
    }

    // Apply sorting
    const ascending = sortOrder === 'asc'
    if (sortBy === 'business_name') {
      query = query.order('name', { foreignTable: 'businesses', ascending })
    } else if (sortBy === 'funnel_name') {
      query = query.order('name', { foreignTable: 'funnels', ascending })
    } else {
      query = query.order(sortBy, { ascending })
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: codes, error, count } = await query

    if (error) {
      console.error('Error fetching codes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch codes' },
        { status: 500 }
      )
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      codes: codes || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        status: status || 'all',
        search: search || '',
        sort: sortBy,
        order: sortOrder
      }
    })

  } catch (error) {
    console.error('Error in codes API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint for bulk operations
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params
  try {
    // Require admin authentication
    const { admin } = await requireAdmin()
    const supabase = await createClient()

    const body = await request.json()
    const { action, codeIds, data } = body

    if (!action || !codeIds || !Array.isArray(codeIds)) {
      return NextResponse.json(
        { error: 'Invalid request. Action and codeIds are required.' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'export':
        // Export selected codes to CSV
        const { data: exportCodes, error: exportError } = await supabase
          .from('reserved_codes')
          .select(`
            code,
            status,
            businesses(name, email),
            funnels(name, status),
            assigned_at,
            created_at
          `)
          .in('id', codeIds)
          .eq('batch_id', id)

        if (exportError) throw exportError

        result = { codes: exportCodes }
        break

      case 'mark_damaged':
        // Mark codes as damaged
        const { error: damageError } = await supabase
          .from('reserved_codes')
          .update({
            status: 'damaged',
            updated_at: new Date().toISOString()
          })
          .in('id', codeIds)
          .eq('batch_id', id)
          .eq('status', 'available') // Only available codes can be marked damaged

        if (damageError) throw damageError

        // Log the bulk action
        const damageAllocations = codeIds.map(codeId => ({
          reserved_code_id: codeId,
          action: 'damage',
          new_status: 'damaged',
          admin_id: admin.id,
          reason: data?.reason || 'Bulk operation'
        }))

        await supabase
          .from('code_allocations')
          .insert(damageAllocations)

        result = { updated: codeIds.length }
        break

      case 'assign_business':
        // Assign multiple codes to the same business (different funnels)
        if (!data?.businessId || !data?.assignments) {
          return NextResponse.json(
            { error: 'Business ID and assignments are required for bulk assignment' },
            { status: 400 }
          )
        }

        // Process assignments one by one to maintain atomicity
        const assignmentResults = []
        for (const assignment of data.assignments) {
          const { codeId, funnelId } = assignment

          try {
            const { data: assignResult, error: assignError } = await supabase.rpc(
              'assign_code_to_funnel',
              {
                p_code_id: codeId,
                p_funnel_id: funnelId,
                p_admin_id: admin.id
              }
            )

            if (assignError) throw assignError

            assignmentResults.push({
              codeId,
              funnelId,
              success: assignResult?.success || false,
              error: assignResult?.error
            })
          } catch (error) {
            assignmentResults.push({
              codeId,
              funnelId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }

        result = { assignments: assignmentResults }
        break

      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      action,
      result
    })

  } catch (error) {
    console.error('Error in bulk operation:', error)
    return NextResponse.json(
      { error: 'Failed to complete bulk operation' },
      { status: 500 }
    )
  }
}