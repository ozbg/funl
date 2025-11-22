import type {
  InventoryOverview,
  CodeInventory
} from '@/lib/types/qr-reservation'
import type { SupabaseClient } from '@supabase/supabase-js'

export class InventoryService {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Get comprehensive inventory overview
   */
  async getInventoryOverview(): Promise<InventoryOverview> {
    // Get total counts by status
    const { data: statusData } = await this.supabase
      .from('reserved_codes')
      .select('status')

    const statusCounts = {
      available: 0,
      reserved: 0,
      assigned: 0,
      damaged: 0,
      expired: 0,
      lost: 0
    }

    statusData?.forEach((row: unknown) => {
      const status = (row as Record<string, unknown>).status as keyof typeof statusCounts
      if (status in statusCounts) {
        statusCounts[status]++
      }
    })

    // Get counts by batch (replacing size concept)
    const { data: batchData } = await this.supabase
      .from('reserved_codes')
      .select(`
        id,
        qr_code_batches!inner(name, batch_number)
      `)
      .eq('status', 'available')

    const batchCounts: Record<string, number> = {}
    batchData?.forEach((row: unknown) => {
      const rowData = row as Record<string, unknown>
      const qrCodeBatches = rowData.qr_code_batches as Record<string, unknown> | undefined
      const batchName = qrCodeBatches?.name as string
      if (batchName) {
        batchCounts[batchName] = (batchCounts[batchName] || 0) + 1
      }
    })

    // Get counts by style
    const { data: styleData } = await this.supabase
      .from('reserved_codes')
      .select(`
        id,
        qr_code_batches!inner(
          qr_code_presets!inner(name)
        )
      `)
      .eq('status', 'available')

    const styleCounts: Record<string, number> = {}
    styleData?.forEach((row: unknown) => {
      const rowData = row as Record<string, unknown>
      const qrCodeBatches = rowData.qr_code_batches as Record<string, unknown> | undefined
      const qrCodePresets = qrCodeBatches?.qr_code_presets as Record<string, unknown> | undefined
      const style = qrCodePresets?.name as string
      if (style) {
        styleCounts[style] = (styleCounts[style] || 0) + 1
      }
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

    const lowStockAlerts = lowStockBatches?.map((batch: unknown) => {
      const batchData = batch as Record<string, unknown>
      return {
        batchId: batchData.id as string,
        batchNumber: batchData.batch_number as string,
        size: 'All Sizes', // Physical size chosen at print time
        available: batchData.quantity_available as number,
        reorderPoint: 100 // Default reorder point
      }
    }) || []

    return {
      totalCodes: (statusCounts.available || 0) + (statusCounts.reserved || 0) + (statusCounts.assigned || 0) + (statusCounts.damaged || 0) + (statusCounts.expired || 0) + (statusCounts.lost || 0),
      availableCodes: statusCounts.available || 0,
      reservedCodes: statusCounts.reserved || 0,
      assignedCodes: statusCounts.assigned || 0,
      damagedCodes: (statusCounts.damaged || 0) + (statusCounts.lost || 0),
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

    return data as CodeInventory[]
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
      details?: unknown
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

    return data as CodeInventory[]
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