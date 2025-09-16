import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { NextResponse } from 'next/server'
import { InventoryService } from '@/lib/services/inventory'

export async function GET() {
  try {
    await requireAdmin()

    const supabase = await createClient()
    const inventoryService = new InventoryService(supabase)

    const overview = await inventoryService.getInventoryOverview()

    return NextResponse.json(overview)
  } catch (error) {
    console.error('Error fetching inventory overview:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}