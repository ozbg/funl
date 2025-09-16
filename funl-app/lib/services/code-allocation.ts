import { createClient } from '@/lib/supabase/server'
import type {
  AllocateCodeRequest,
  AllocatedCode,
  ReserveCodeRequest,
  ReserveCodeResponse,
  ReservedCode,
  CodeAllocation
} from '@/lib/types/qr-reservation'

export class AllocationService {
  private supabase: any

  constructor(supabase: any) {
    this.supabase = supabase
  }

  /**
   * Allocate a code to a funnel with atomic double-allocation prevention
   */
  async allocateCode(params: AllocateCodeRequest): Promise<AllocatedCode> {
    const { businessId, funnelId, codeId } = params

    // Use Postgres transaction for atomicity
    const { data: allocatedCode, error } = await this.supabase.rpc(
      'allocate_reserved_code',
      {
        p_business_id: businessId,
        p_funnel_id: funnelId,
        p_code_id: codeId || null
      }
    )

    if (error) {
      throw new AllocationError(`Failed to allocate code: ${error.message}`)
    }

    if (!allocatedCode) {
      throw new AllocationError('No available codes for allocation')
    }

    return allocatedCode as AllocatedCode
  }

  /**
   * Reserve a code temporarily for a business
   */
  async reserveCode(params: ReserveCodeRequest): Promise<ReserveCodeResponse> {
    const { businessId, size, stylePresetId, duration } = params
    const expiresAt = new Date(Date.now() + duration * 60 * 1000)

    // Find an available code matching criteria
    let query = this.supabase
      .from('reserved_codes')
      .select('*')
      .eq('status', 'available')
      .is('business_id', null)
      .limit(1)

    // Add filters if provided
    if (size || stylePresetId) {
      query = query
        .from('reserved_codes')
        .select(`
          *,
          qr_code_batches!inner(size, style_preset_id)
        `)
        .eq('status', 'available')
        .is('business_id', null)

      if (size) {
        query = query.eq('qr_code_batches.size', size)
      }
      if (stylePresetId) {
        query = query.eq('qr_code_batches.style_preset_id', stylePresetId)
      }
    }

    const { data: availableCode } = await query.single()

    if (!availableCode) {
      throw new AllocationError('No available codes matching criteria')
    }

    // Reserve the code
    const { data: reservedCode, error } = await this.supabase
      .from('reserved_codes')
      .update({
        status: 'reserved',
        business_id: businessId,
        reserved_at: new Date(),
        reserved_until: expiresAt
      })
      .eq('id', availableCode.id)
      .eq('status', 'available') // Double-check status hasn't changed
      .select()
      .single()

    if (error || !reservedCode) {
      throw new AllocationError('Failed to reserve code - it may have been taken')
    }

    // Log the reservation
    await this.logAllocation({
      reserved_code_id: reservedCode.id,
      action: 'reserve',
      business_id: businessId,
      new_status: 'reserved',
      previous_status: 'available',
      metadata: { duration, expiresAt }
    })

    return {
      reservationId: reservedCode.id,
      codeId: reservedCode.id,
      code: reservedCode.code,
      expiresAt,
      qrPreview: reservedCode.base_qr_svg
    }
  }

  /**
   * Release a reserved code back to available status
   */
  async releaseReservation(reservationId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('reserved_codes')
      .update({
        status: 'available',
        business_id: null,
        reserved_at: null,
        reserved_until: null
      })
      .eq('id', reservationId)
      .eq('status', 'reserved')
      .select()
      .single()

    if (error || !data) {
      return false
    }

    // Log the release
    await this.logAllocation({
      reserved_code_id: reservationId,
      action: 'release',
      new_status: 'available',
      previous_status: 'reserved'
    })

    return true
  }

  /**
   * Assign a reserved code to a funnel
   */
  async assignReservedCodeToFunnel(
    reservationId: string,
    funnelId: string
  ): Promise<AllocatedCode> {
    // Verify reservation exists and is valid
    const { data: reservation } = await this.supabase
      .from('reserved_codes')
      .select('*')
      .eq('id', reservationId)
      .eq('status', 'reserved')
      .single()

    if (!reservation) {
      throw new AllocationError('Invalid or expired reservation')
    }

    // Assign the code
    const { data: assignedCode, error } = await this.supabase
      .from('reserved_codes')
      .update({
        status: 'assigned',
        funnel_id: funnelId,
        assigned_at: new Date(),
        reserved_at: null,
        reserved_until: null
      })
      .eq('id', reservationId)
      .eq('status', 'reserved')
      .select()
      .single()

    if (error || !assignedCode) {
      throw new AllocationError('Failed to assign reserved code')
    }

    // Update the funnel
    await this.supabase
      .from('funnels')
      .update({
        reserved_code_id: assignedCode.id,
        code_source: 'reserved',
        short_url: assignedCode.code
      })
      .eq('id', funnelId)

    // Log the assignment
    await this.logAllocation({
      reserved_code_id: assignedCode.id,
      action: 'assign',
      funnel_id: funnelId,
      business_id: assignedCode.business_id,
      new_status: 'assigned',
      previous_status: 'reserved'
    })

    return {
      id: assignedCode.id,
      code: assignedCode.code,
      status: 'assigned',
      funnelId: assignedCode.funnel_id!,
      businessId: assignedCode.business_id!,
      assignedAt: assignedCode.assigned_at!
    }
  }

  /**
   * Expire old reservations
   */
  async expireOldReservations(): Promise<number> {
    const { data, error } = await this.supabase.rpc('expire_old_reservations')

    if (error) {
      console.error('Error expiring reservations:', error)
      return 0
    }

    return data || 0
  }

  /**
   * Clear stuck allocation locks
   */
  async clearStuckAllocationLocks(): Promise<number> {
    const { data, error } = await this.supabase.rpc('clear_stuck_allocation_locks')

    if (error) {
      console.error('Error clearing locks:', error)
      return 0
    }

    return data || 0
  }

  /**
   * Log allocation action for audit trail
   */
  private async logAllocation(allocation: Partial<CodeAllocation>): Promise<void> {
    const { error } = await this.supabase
      .from('code_allocations')
      .insert({
        ...allocation,
        is_successful: true
      })

    if (error) {
      console.error('Failed to log allocation:', error)
    }
  }

  /**
   * Get allocation history for a code
   */
  async getCodeAllocationHistory(codeId: string): Promise<CodeAllocation[]> {
    const { data, error } = await this.supabase
      .from('code_allocations')
      .select('*')
      .eq('reserved_code_id', codeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching allocation history:', error)
      return []
    }

    return data as CodeAllocation[]
  }

  /**
   * Mark code as damaged or lost
   */
  async markCodeStatus(
    codeId: string,
    status: 'damaged' | 'lost',
    reason: string,
    adminId: string
  ): Promise<boolean> {
    const { data: previousCode } = await this.supabase
      .from('reserved_codes')
      .select('status')
      .eq('id', codeId)
      .single()

    const { error } = await this.supabase
      .from('reserved_codes')
      .update({ status })
      .eq('id', codeId)

    if (error) {
      return false
    }

    // Log the status change
    await this.logAllocation({
      reserved_code_id: codeId,
      action: 'damage',
      admin_id: adminId,
      new_status: status,
      previous_status: previousCode?.status,
      reason
    })

    return true
  }
}

/**
 * Custom error class for allocation errors
 */
export class AllocationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AllocationError'
  }
}