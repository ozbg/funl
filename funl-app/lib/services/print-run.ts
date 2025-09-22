import type {
  CreatePrintRunRequest,
  PrintRunResponse,
  CodePrintRun
} from '@/lib/types/qr-reservation'
import type { SupabaseClient } from '@supabase/supabase-js'

export class PrintRunService {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async createPrintRuns(request: CreatePrintRunRequest): Promise<PrintRunResponse> {
    const printRuns: {
      id: string
      size: string
      quantity: number
      qrCodeSvg?: string
      printFileUrl?: string
      unitCost: number
      totalCost: number
    }[] = []
    let totalCost = 0

    // Get the reserved code
    const { data: code, error: codeError } = await this.supabase
      .from('reserved_codes')
      .select('*')
      .eq('id', request.reservedCodeId)
      .single()

    if (codeError || !code) {
      throw new Error('Code not found')
    }

    // Create print run for each size/quantity combination
    for (const order of request.orders) {
      // Get style preset
      const { data: stylePreset } = await this.supabase
        .from('qr_code_presets')
        .select('*')
        .eq('id', order.stylePresetId)
        .single()

      // Generate QR settings
      const generationSettings = {
        code: code.code,
        size: order.size,
        stylePresetId: order.stylePresetId,
        styleConfig: stylePreset?.style_config || {},
        url: `${process.env.NEXT_PUBLIC_APP_URL}/f/${code.code}`,
        ...order.customizations
      }

      // Calculate costs (simplified pricing model)
      const unitCost = this.calculateUnitCost(order.size, order.quantity)
      const orderCost = unitCost * order.quantity
      totalCost += orderCost

      // Store print run
      const { data: printRun, error: printError } = await this.supabase
        .from('code_print_runs')
        .insert({
          reserved_code_id: request.reservedCodeId,
          business_id: request.businessId,
          funnel_id: request.funnelId,
          size: order.size,
          style_preset_id: order.stylePresetId,
          quantity_ordered: order.quantity,
          generation_settings: generationSettings,
          unit_cost: unitCost,
          total_cost: orderCost,
          status: 'ordered',
          custom_message: order.customizations?.topText || order.customizations?.bottomText
        })
        .select()
        .single()

      if (printError) {
        throw new Error(`Failed to create print run: ${printError.message}`)
      }

      const printRunData = printRun as Record<string, unknown>
      printRuns.push({
        id: printRunData.id as string,
        size: printRunData.size as string,
        quantity: printRunData.quantity_ordered as number,
        unitCost,
        totalCost: orderCost
      })

      // Log the print action
      await this.supabase
        .from('code_allocations')
        .insert({
          reserved_code_id: request.reservedCodeId,
          action: 'print',
          print_run_id: printRunData.id as string,
          business_id: request.businessId,
          metadata: { order }
        })
    }

    return {
      printRuns,
      totalCost,
      estimatedDelivery: this.calculateDeliveryDate()
    }
  }

  /**
   * Calculate unit cost based on size and quantity
   * Simplified pricing model - in production this would be more complex
   */
  private calculateUnitCost(size: string, quantity: number): number {
    const basePrices: Record<string, number> = {
      '25mm': 0.10,
      '50mm': 0.15,
      '75mm': 0.20,
      '100mm': 0.30,
      '150mm': 0.50,
      '200mm': 0.80,
      '300mm': 1.50
    }

    const basePrice = basePrices[size] || 0.20

    // Quantity discounts
    if (quantity >= 1000) return basePrice * 0.7
    if (quantity >= 500) return basePrice * 0.8
    if (quantity >= 100) return basePrice * 0.9

    return basePrice
  }

  /**
   * Calculate estimated delivery date
   */
  private calculateDeliveryDate(): Date {
    // Add 5-7 business days for standard delivery
    const deliveryDays = 7
    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays)
    return deliveryDate
  }

  /**
   * Reprint an existing code with same settings
   */
  async reprintCode(printRunId: string, quantity: number): Promise<CodePrintRun> {
    // Get original print run settings
    const { data: originalRun, error } = await this.supabase
      .from('code_print_runs')
      .select('*')
      .eq('id', printRunId)
      .single()

    if (error || !originalRun) {
      throw new Error('Original print run not found')
    }

    // Create new print run with same settings
    const { data: newRun, error: createError } = await this.supabase
      .from('code_print_runs')
      .insert({
        reserved_code_id: originalRun.reserved_code_id,
        business_id: originalRun.business_id,
        funnel_id: originalRun.funnel_id,
        size: originalRun.size,
        style_preset_id: originalRun.style_preset_id,
        quantity_ordered: quantity,
        generation_settings: originalRun.generation_settings,
        qr_code_svg: originalRun.qr_code_svg,
        unit_cost: this.calculateUnitCost(originalRun.size, quantity),
        total_cost: this.calculateUnitCost(originalRun.size, quantity) * quantity,
        status: 'ordered',
        custom_message: originalRun.custom_message
      })
      .select()
      .single()

    if (createError) {
      throw new Error(`Failed to create reprint: ${createError.message}`)
    }

    // Log the reprint
    await this.supabase
      .from('code_allocations')
      .insert({
        reserved_code_id: originalRun.reserved_code_id,
        action: 'reprint',
        print_run_id: newRun.id,
        business_id: originalRun.business_id,
        metadata: { original_print_run_id: printRunId, quantity }
      })

    return newRun as CodePrintRun
  }

  /**
   * Update print run status
   */
  async updatePrintRunStatus(
    printRunId: string,
    status: CodePrintRun['status']
  ): Promise<boolean> {
    const updateData: Partial<CodePrintRun> = { status }

    // Add timestamp fields based on status
    if (status === 'printed') updateData.printed_at = new Date()
    if (status === 'shipped') updateData.shipped_at = new Date()
    if (status === 'delivered') updateData.delivered_at = new Date()
    if (status === 'cancelled') updateData.cancelled_at = new Date()

    const { error } = await this.supabase
      .from('code_print_runs')
      .update(updateData)
      .eq('id', printRunId)

    if (error) {
      console.error('Error updating print run status:', error)
      return false
    }

    return true
  }

  /**
   * Get print runs for a business
   */
  async getBusinessPrintRuns(businessId: string): Promise<CodePrintRun[]> {
    const { data, error } = await this.supabase
      .from('code_print_runs')
      .select(`
        *,
        reserved_codes(code, batch_id),
        qr_code_presets(name, slug)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching print runs:', error)
      return []
    }

    return data as CodePrintRun[]
  }

  /**
   * Get print runs for a specific code
   */
  async getCodePrintRuns(codeId: string): Promise<CodePrintRun[]> {
    const { data, error } = await this.supabase
      .from('code_print_runs')
      .select('*')
      .eq('reserved_code_id', codeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching code print runs:', error)
      return []
    }

    return data as CodePrintRun[]
  }

  /**
   * Cancel a print run
   */
  async cancelPrintRun(printRunId: string, reason?: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('code_print_runs')
      .update({
        status: 'cancelled',
        cancelled_at: new Date(),
        customer_notes: reason
      })
      .eq('id', printRunId)
      .in('status', ['ordered', 'printing']) // Can only cancel if not yet shipped

    if (error) {
      console.error('Error cancelling print run:', error)
      return false
    }

    return true
  }
}