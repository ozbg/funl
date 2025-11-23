import { requireStripe } from '@/lib/stripe/stripe-client'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const stripe = requireStripe()
    const supabase = await createClient()

    // Check admin auth
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

    const { batch_id } = await request.json()

    if (!batch_id) {
      return NextResponse.json({ error: 'batch_id required' }, { status: 400 })
    }

    // Get batch details
    const { data: batch, error: batchError } = await supabase
      .from('qr_code_batches')
      .select('*')
      .eq('id', batch_id)
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    let productId = batch.stripe_product_id

    // Create or update Stripe product
    if (productId) {
      // Update existing product
      await stripe.products.update(productId, {
        name: batch.name,
        description: batch.description || `QR Code Stickers - ${batch.batch_number}`,
        active: batch.is_available_for_purchase ?? true,
        metadata: {
          batch_id: batch.id,
          batch_number: batch.batch_number,
          funl_app: 'true',
        },
      })
    } else {
      // Create new product
      const product = await stripe.products.create({
        name: batch.name,
        description: batch.description || `QR Code Stickers - ${batch.batch_number}`,
        active: batch.is_available_for_purchase ?? true,
        metadata: {
          batch_id: batch.id,
          batch_number: batch.batch_number,
          funl_app: 'true',
        },
      })
      productId = product.id
    }

    // Create/update price (use base tier price)
    const baseTier = batch.pricing_tiers?.[0] || { unit_price: 5.00 }
    const price = await stripe.prices.create({
      product: productId,
      currency: 'aud',
      unit_amount: Math.round(baseTier.unit_price * 100), // Convert to cents
      metadata: {
        batch_id: batch.id,
        tier_index: '0',
        tier_min: baseTier.min_quantity?.toString() || '1',
        tier_max: baseTier.max_quantity?.toString() || 'unlimited',
      },
    })

    // Update batch with Stripe IDs
    await supabase
      .from('qr_code_batches')
      .update({
        stripe_product_id: productId,
        stripe_price_id: price.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batch_id)

    // Log sync
    await supabase.from('stripe_product_sync').upsert({
      batch_id,
      stripe_product_id: productId,
      stripe_price_ids: { default: price.id },
      last_synced_at: new Date().toISOString(),
      sync_status: 'synced',
    }, {
      onConflict: 'batch_id'
    })

    return NextResponse.json({
      success: true,
      product_id: productId,
      price_id: price.id,
    })

  } catch (error) {
    console.error('Stripe sync error:', error)

    // Log error to database
    try {
      const supabase = await createClient()
      const { batch_id } = await request.json()

      if (batch_id) {
        await supabase.from('stripe_product_sync').upsert({
          batch_id,
          stripe_product_id: '',
          stripe_price_ids: {},
          sync_status: 'error',
          sync_error: error instanceof Error ? error.message : 'Unknown error',
          last_synced_at: new Date().toISOString(),
        }, {
          onConflict: 'batch_id'
        })
      }
    } catch (logError) {
      console.error('Failed to log sync error:', logError)
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync with Stripe' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check admin auth
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

    const { batch_id } = await request.json()

    if (!batch_id) {
      return NextResponse.json({ error: 'batch_id required' }, { status: 400 })
    }

    // Remove Stripe IDs from batch
    await supabase
      .from('qr_code_batches')
      .update({
        stripe_product_id: null,
        stripe_price_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batch_id)

    // Remove sync record
    await supabase
      .from('stripe_product_sync')
      .delete()
      .eq('batch_id', batch_id)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error removing sync:', error)
    return NextResponse.json(
      { error: 'Failed to remove sync' },
      { status: 500 }
    )
  }
}
