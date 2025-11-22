import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface PricingUpdateRequest {
  pricing_tiers: Array<{
    min_quantity: number
    max_quantity: number | null
    unit_price: number
  }>
  size_pricing: Record<string, number>
  is_available_for_purchase: boolean
  featured: boolean
  min_purchase_quantity: number
  max_purchase_quantity?: number | null
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Check admin authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body: PricingUpdateRequest = await request.json()
    const {
      pricing_tiers,
      size_pricing,
      is_available_for_purchase,
      featured,
      min_purchase_quantity,
      max_purchase_quantity,
    } = body

    // Validate pricing tiers
    if (!pricing_tiers || pricing_tiers.length === 0) {
      return NextResponse.json({ error: 'At least one pricing tier required' }, { status: 400 })
    }

    // Validate each tier
    for (const tier of pricing_tiers) {
      if (tier.min_quantity < 1) {
        return NextResponse.json({ error: 'Minimum quantity must be at least 1' }, { status: 400 })
      }
      if (tier.unit_price <= 0) {
        return NextResponse.json({ error: 'Unit price must be greater than 0' }, { status: 400 })
      }
      if (tier.max_quantity !== null && tier.max_quantity < tier.min_quantity) {
        return NextResponse.json({ error: 'Maximum quantity must be greater than minimum' }, { status: 400 })
      }
    }

    // Get current pricing for history
    const { data: currentBatch } = await supabase
      .from('qr_code_batches')
      .select('pricing_tiers, size_pricing, base_price')
      .eq('id', id)
      .single()

    if (!currentBatch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    // Calculate base price from first tier
    const base_price = pricing_tiers[0].unit_price

    // Update batch
    const { error: updateError } = await supabase
      .from('qr_code_batches')
      .update({
        pricing_tiers,
        size_pricing,
        base_price,
        is_available_for_purchase,
        featured,
        min_purchase_quantity,
        max_purchase_quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating pricing:', updateError)
      return NextResponse.json({ error: 'Failed to update pricing' }, { status: 500 })
    }

    // Log price change if pricing actually changed
    if (
      JSON.stringify(currentBatch.pricing_tiers) !== JSON.stringify(pricing_tiers) ||
      JSON.stringify(currentBatch.size_pricing) !== JSON.stringify(size_pricing)
    ) {
      await supabase.from('batch_price_history').insert({
        batch_id: id,
        pricing_tiers,
        size_pricing,
        base_price,
        changed_by: user.id,
        changed_reason: 'Manual update via admin UI',
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating pricing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
