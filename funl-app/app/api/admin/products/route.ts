import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/products
 * List all products with filtering, pagination, and stats
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin status
  const { data: adminCheck } = await authClient
    .from('businesses')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get query parameters
  const searchParams = request.nextUrl.searchParams
  const productType = searchParams.get('product_type')
  const isActive = searchParams.get('is_active')
  const tracksInventory = searchParams.get('tracks_inventory')
  const search = searchParams.get('search')
  const showDeleted = searchParams.get('show_deleted') === 'true'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = (page - 1) * limit

  // Build query
  const serviceClient = await createServiceClient()
  let query = serviceClient
    .from('sellable_products')
    .select('*', { count: 'exact' })

  // Filter deleted products (default: hide deleted)
  if (!showDeleted) {
    query = query.is('deleted_at', null)
  } else {
    query = query.not('deleted_at', 'is', null)
  }

  // Apply filters
  if (productType) {
    query = query.eq('product_type', productType)
  }
  if (isActive !== null) {
    query = query.eq('is_active', isActive === 'true')
  }
  if (tracksInventory !== null) {
    query = query.eq('tracks_inventory', tracksInventory === 'true')
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  // Apply pagination and sorting
  query = query
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: products, error, count } = await query

  if (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch inventory stats for products that track inventory
  const productsWithInventory = await Promise.all(
    (products || []).map(async (product) => {
      if (!product.tracks_inventory) {
        return {
          ...product,
          inventory_allocated: 0,
          inventory_remaining: 0,
          batches_linked: 0
        }
      }

      const { data: inventoryStats } = await serviceClient
        .from('product_batch_inventory')
        .select('quantity_allocated, quantity_remaining')
        .eq('product_id', product.id)
        .eq('is_active', true)

      const totalAllocated = inventoryStats?.reduce((sum, inv) => sum + (inv.quantity_allocated || 0), 0) || 0
      const totalRemaining = inventoryStats?.reduce((sum, inv) => sum + (inv.quantity_remaining || 0), 0) || 0

      return {
        ...product,
        inventory_allocated: totalAllocated,
        inventory_remaining: totalRemaining,
        batches_linked: inventoryStats?.length || 0
      }
    })
  )

  // Calculate stats
  const allProducts = await serviceClient
    .from('sellable_products')
    .select('is_active, tracks_inventory, current_stock, deleted_at')

  const activeProducts = allProducts.data?.filter(p => !p.deleted_at) || []
  const deletedProducts = allProducts.data?.filter(p => p.deleted_at) || []

  const stats = {
    total_products: activeProducts.length,
    active_products: activeProducts.filter(p => p.is_active).length,
    inactive_products: activeProducts.filter(p => !p.is_active).length,
    deleted_products: deletedProducts.length,
    low_stock_count: activeProducts.filter(p =>
      p.tracks_inventory &&
      p.current_stock !== null &&
      p.current_stock <= 10
    ).length
  }

  return NextResponse.json({
    products: productsWithInventory,
    pagination: {
      page,
      limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / limit)
    },
    stats
  })
}

/**
 * POST /api/admin/products
 * Create a new product
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: adminCheck } = await authClient
    .from('businesses')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse request body
  const body = await request.json()
  const {
    name,
    slug,
    description,
    product_type,
    pricing_tiers,
    available_sizes,
    available_styles,
    size_pricing,
    tracks_inventory,
    current_stock,
    low_stock_threshold,
    min_purchase_quantity,
    max_purchase_quantity,
    thumbnail_url,
    images,
    meta_title,
    meta_description,
    meta_keywords,
    reason,
    notes
  } = body

  // Validate required fields
  if (!name || !slug || !product_type || !pricing_tiers || !reason || reason.length < 10) {
    return NextResponse.json({
      error: 'Missing required fields: name, slug, product_type, pricing_tiers, reason (min 10 chars)'
    }, { status: 400 })
  }

  // Create product
  const serviceClient = await createServiceClient()
  const { data: product, error: createError } = await serviceClient
    .from('sellable_products')
    .insert({
      name,
      slug,
      description,
      product_type,
      pricing_tiers,
      available_sizes: available_sizes || null,
      available_styles: available_styles || null,
      size_pricing: size_pricing || null,
      is_active: true,
      featured: false,
      display_order: 999,
      tracks_inventory: tracks_inventory || false,
      current_stock: current_stock || null,
      low_stock_threshold: low_stock_threshold || null,
      min_purchase_quantity: min_purchase_quantity || 1,
      max_purchase_quantity: max_purchase_quantity || null,
      thumbnail_url: thumbnail_url || null,
      images: images || null,
      meta_title: meta_title || null,
      meta_description: meta_description || null,
      meta_keywords: meta_keywords || null
    })
    .select()
    .single()

  if (createError) {
    console.error('Error creating product:', createError)
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  // Log admin action
  try {
    await serviceClient.rpc('log_admin_action', {
      p_action: 'created',
      p_entity_type: 'product',
      p_entity_id: product.id,
      p_business_id: null,
      p_old_values: null,
      p_new_values: product,
      p_admin_id: user.id,
      p_reason: reason,
      p_notes: notes || null
    })
  } catch (logError) {
    console.error('Failed to log admin action:', logError)
  }

  return NextResponse.json({ product }, { status: 201 })
}
