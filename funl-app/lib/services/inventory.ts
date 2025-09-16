import { createClient } from '@/lib/supabase/server'
import type {
  InventoryOverview,
  CodeInventory,
  QRCodeBatch
} from '@/lib/types/qr-reservation'

export class InventoryService {
  private supabase: any

  constructor(supabase: any) {
    this.supabase = supabase
  }

  /**
   * Get comprehensive inventory overview
   */
  async getInventoryOverview(): Promise<InventoryOverview> {
    // Get total counts by status
    const { data: statusCounts } = await this.supabase
      .from('reserved_codes')
      .select('status')
      .then((result: any) => {
        const counts = {
          available: 0,
          reserved: 0,
          assigned: 0,
          damaged: 0,
          expired: 0,
          lost: 0
        }
        result.data?.forEach((row: any) => {
          counts[row.status as keyof typeof counts]++
        })
        return { data: counts }
      })

    // Get counts by batch (replacing size concept)
    const { data: batchCounts } = await this.supabase
      .from('reserved_codes')
      .select(`
        id,
        qr_code_batches!inner(name, batch_number)
      `)
      .eq('status', 'available')
      .then((result: any) => {
        const counts: Record<string, number> = {}
        result.data?.forEach((row: any) => {
          const batchName = (row as any).qr_code_batches.name
          counts[batchName] = (counts[batchName] || 0) + 1
        })
        return { data: counts }
      })

    // Get counts by style
    const { data: styleCounts } = await this.supabase
      .from('reserved_codes')
      .select(`
        id,
        qr_code_batches!inner(
          qr_code_presets!inner(name)
        )
      `)
      .eq('status', 'available')
      .then((result: any) => {
        const counts: Record<string, number> = {}
        result.data?.forEach((row: any) => {
          const style = (row as any).qr_code_batches.qr_code_presets.name
          counts[style] = (counts[style] || 0) + 1
        })
        return { data: counts }
      })

    // Get low stock alerts
    const { data: lowStockBatches } = await this.supabase
      .from('qr_code_batches')
      .select(`
        id,
        batch_number,
        name,
        quantity_available,
        qr_code_presets(name)
      `)
      .lt('quantity_available', 100) // Alert when less than 100 available
      .order('quantity_available', { ascending: true })

    const lowStockAlerts = lowStockBatches?.map((batch: any) => ({
      batchId: batch.id,
      batchNumber: batch.batch_number,
      size: 'All Sizes', // Physical size chosen at print time
      available: batch.quantity_available,
      reorderPoint: 100 // Default reorder point
    })) || []

    return {
      totalCodes: (statusCounts?.available || 0) + (statusCounts?.reserved || 0) + (statusCounts?.assigned || 0) + (statusCounts?.damaged || 0) + (statusCounts?.expired || 0) + (statusCounts?.lost || 0),
      availableCodes: statusCounts?.available || 0,
      reservedCodes: statusCounts?.reserved || 0,
      assignedCodes: statusCounts?.assigned || 0,
      damagedCodes: (statusCounts?.damaged || 0) + (statusCounts?.lost || 0),
      bySize: batchCounts || {},
      byStyle: styleCounts || {},
      lowStockAlerts
    }
  }

  /**
   * Get inventory by location
   */
  async getInventoryByLocation(): Promise<CodeInventory[]> {
    const { data, error } = await this.supabase
      .from('code_inventory')
      .select(`
        *,
        qr_code_batches(
          batch_number,
          name,
          description
        )
      `)
      .order('location_name', { ascending: true })

    if (error) {
      console.error('Error fetching inventory by location:', error)
      return []
    }

    return data as any[]
  }

  /**
   * Update inventory quantities
   */
  async updateInventory(
    inventoryId: string,
    updates: {
      quantity_on_hand?: number
      quantity_allocated?: number
      location_name?: string
      location_type?: CodeInventory['location_type']
    }
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('code_inventory')
      .update(updates)
      .eq('id', inventoryId)

    if (error) {
      console.error('Error updating inventory:', error)
      return false
    }

    return true
  }

  /**
   * Create inventory record for a batch
   */
  async createInventoryRecord(
    batchId: string,
    location: {
      type: CodeInventory['location_type']
      name: string
      details?: any
    },
    quantity: number
  ): Promise<CodeInventory | null> {
    const { data, error } = await this.supabase
      .from('code_inventory')
      .insert({
        batch_id: batchId,
        location_type: location.type,
        location_name: location.name,
        location_details: location.details || {},
        quantity_on_hand: quantity,
        quantity_allocated: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating inventory record:', error)
      return null
    }

    return data as CodeInventory
  }

  /**
   * Transfer inventory between locations
   */
  async transferInventory(
    fromInventoryId: string,
    toInventoryId: string,
    quantity: number
  ): Promise<boolean> {
    // Start a transaction-like operation
    // First, check if source has enough inventory
    const { data: fromInventory } = await this.supabase
      .from('code_inventory')
      .select('quantity_on_hand, quantity_allocated')
      .eq('id', fromInventoryId)
      .single()

    if (!fromInventory || fromInventory.quantity_on_hand - fromInventory.quantity_allocated < quantity) {
      console.error('Insufficient inventory for transfer')
      return false
    }

    // Reduce from source
    const { error: fromError } = await this.supabase
      .from('code_inventory')
      .update({
        quantity_on_hand: fromInventory.quantity_on_hand - quantity
      })
      .eq('id', fromInventoryId)

    if (fromError) {
      console.error('Error reducing source inventory:', fromError)
      return false
    }

    // Add to destination
    const { data: toInventory } = await this.supabase
      .from('code_inventory')
      .select('quantity_on_hand')
      .eq('id', toInventoryId)
      .single()

    const { error: toError } = await this.supabase
      .from('code_inventory')
      .update({
        quantity_on_hand: (toInventory?.quantity_on_hand || 0) + quantity
      })
      .eq('id', toInventoryId)

    if (toError) {
      // Try to rollback the source reduction
      await this.supabase
        .from('code_inventory')
        .update({
          quantity_on_hand: fromInventory.quantity_on_hand
        })
        .eq('id', fromInventoryId)

      console.error('Error adding to destination inventory:', toError)
      return false
    }

    return true
  }

  /**
   * Set reorder points for inventory
   */
  async setReorderPoint(
    inventoryId: string,
    reorderPoint: number,
    reorderQuantity: number
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('code_inventory')
      .update({
        reorder_point: reorderPoint,
        reorder_quantity: reorderQuantity
      })
      .eq('id', inventoryId)

    if (error) {
      console.error('Error setting reorder point:', error)
      return false
    }

    return true
  }

  /**
   * Get items needing reorder
   */
  async getReorderNeeded(): Promise<CodeInventory[]> {
    const { data, error } = await this.supabase
      .from('code_inventory')
      .select(`
        *,
        qr_code_batches(
          batch_number,
          name,
          description,
          style_preset_id
        )
      `)
      .not('reorder_point', 'is', null)
      .filter('quantity_available', 'lte', 'reorder_point')
      .order('quantity_available', { ascending: true })

    if (error) {
      console.error('Error fetching reorder needed:', error)
      return []
    }

    return data as any[]
  }

  /**
   * Record inventory count/audit
   */
  async recordInventoryCount(
    inventoryId: string,
    countedQuantity: number,
    countedBy: string
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('code_inventory')
      .update({
        quantity_on_hand: countedQuantity,
        last_counted_at: new Date(),
        last_counted_by: countedBy
      })
      .eq('id', inventoryId)

    if (error) {
      console.error('Error recording inventory count:', error)
      return false
    }

    return true
  }

  /**
   * Get batch utilization metrics
   */
  async getBatchUtilization(batchId: string): Promise<{
    total: number
    available: number
    reserved: number
    assigned: number
    damaged: number
    utilizationRate: number
  }> {
    const { data: batch } = await this.supabase
      .from('qr_code_batches')
      .select('*')
      .eq('id', batchId)
      .single()

    if (!batch) {
      return {
        total: 0,
        available: 0,
        reserved: 0,
        assigned: 0,
        damaged: 0,
        utilizationRate: 0
      }
    }

    const utilizationRate = batch.quantity > 0
      ? ((batch.quantity_assigned + batch.quantity_reserved) / batch.quantity) * 100
      : 0

    return {
      total: batch.quantity,
      available: batch.quantity_available,
      reserved: batch.quantity_reserved,
      assigned: batch.quantity_assigned,
      damaged: batch.quantity_damaged,
      utilizationRate
    }
  }
}