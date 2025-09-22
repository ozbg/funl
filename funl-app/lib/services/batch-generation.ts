import { nanoid } from 'nanoid'
import { generateQRCodeWithPreset } from '@/lib/qr-generation'
import type {
  GenerateBatchRequest,
  GenerateBatchResponse,
  QRCodeBatch,
  ReservedCode
} from '@/lib/types/qr-reservation'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Generate export ID in format: {sequence}_{batch_number}_{month}_{year}_{url_code}
 * Example: 1_1_09_25_XK0D0qDa
 */
function generateExportId(sequence: number, batchNumber: string, urlCode: string): string {
  const now = new Date()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const year = now.getFullYear().toString().slice(-2)

  // Extract just the batch number from full batch number (e.g., "1" from "BATCH-2025-001")
  const batchNum = batchNumber.match(/(\d+)$/)?.[1] || '1'

  return `${sequence}_${batchNum}_${month}_${year}_${urlCode}`
}

export class BatchGenerationService {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async generateBatch(params: GenerateBatchRequest): Promise<GenerateBatchResponse> {
    // Start a transaction
    const batchNumber = await this.generateBatchNumber()

    // Create batch record
    const batch = await this.createBatch({
      ...params,
      batchNumber
    })

    // Generate unique codes
    const codes = await this.generateUniqueCodes(params.quantity, params.prefix)

    // Store reserved codes
    const reservedCodes = await this.storeReservedCodes(batch.id, codes, params, batch)

    // Generate export URL if needed
    const exportUrl = await this.generateExportUrl(batch.id)

    return {
      batchId: batch.id,
      batchNumber: batch.batch_number,
      codes: reservedCodes.map(rc => ({
        id: rc.id,
        code: rc.code,
        qrSvg: rc.base_qr_svg
      })),
      exportUrl
    }
  }

  private async generateBatchNumber(): Promise<string> {
    const year = new Date().getFullYear()

    // Get the latest batch number for this year
    const { data: latestBatch } = await this.supabase
      .from('qr_code_batches')
      .select('batch_number')
      .like('batch_number', `BATCH-${year}-%`)
      .order('batch_number', { ascending: false })
      .limit(1)
      .single()

    let nextNumber = 1
    if (latestBatch) {
      const match = latestBatch.batch_number.match(/BATCH-\d{4}-(\d{3})/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }

    return `BATCH-${year}-${nextNumber.toString().padStart(3, '0')}`
  }

  private async createBatch(params: GenerateBatchRequest & { batchNumber: string }): Promise<QRCodeBatch> {
    const { data, error } = await this.supabase
      .from('qr_code_batches')
      .insert({
        batch_number: params.batchNumber,
        name: params.name,
        description: params.description,
        quantity: params.quantity,
        style_preset_id: params.stylePresetId,
        status: 'generated',
        quantity_available: params.quantity, // All codes start as available
        quantity_reserved: 0,
        quantity_assigned: 0,
        quantity_damaged: 0,
        sequence_counter: 0, // Initialize sequence counter
        export_settings: {} // Initialize export settings
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create batch: ${error.message}`)
    }

    return data as QRCodeBatch
  }

  private async generateUniqueCodes(quantity: number, prefix?: string): Promise<string[]> {
    const codes: string[] = []
    const maxAttempts = quantity * 10 // Prevent infinite loops

    // Get all existing codes to check against
    const { data: existingCodes } = await this.supabase
      .from('reserved_codes')
      .select('code')

    const { data: existingFunnels } = await this.supabase
      .from('funnels')
      .select('short_url')

    const existingCodeSet = new Set([
      ...(existingCodes?.map((c: unknown) => (c as Record<string, unknown>).code) || []),
      ...(existingFunnels?.map((f: unknown) => (f as Record<string, unknown>).short_url) || [])
    ])

    let attempts = 0
    while (codes.length < quantity && attempts < maxAttempts) {
      attempts++
      const code = prefix
        ? `${prefix}${nanoid(8 - prefix.length)}`
        : nanoid(8)

      if (!existingCodeSet.has(code)) {
        codes.push(code)
        existingCodeSet.add(code)
      }
    }

    if (codes.length < quantity) {
      throw new Error(`Could not generate ${quantity} unique codes. Generated ${codes.length}`)
    }

    return codes
  }

  private async storeReservedCodes(
    batchId: string,
    codes: string[],
    params: GenerateBatchRequest,
    batch: QRCodeBatch
  ): Promise<ReservedCode[]> {
    const expiresAt = params.expiresInDays
      ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined

    // Get style preset for QR generation
    const { data: stylePreset } = await this.supabase
      .from('qr_code_presets')
      .select('*')
      .eq('id', params.stylePresetId)
      .single()

    if (!stylePreset) {
      throw new Error('Style preset not found')
    }

    const reservedCodesData = []

    // Generate QR codes for each code with sequence numbers
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i]
      const sequenceNumber = i + 1 // Start from 1
      const url = `${process.env.NEXT_PUBLIC_APP_URL}/f/${code}`
      const exportId = generateExportId(sequenceNumber, batch.batch_number, code)

      try {
        // Generate the base QR SVG using the preset
        const qrSvg = await generateQRCodeWithPreset({
          url,
          preset: {
            id: stylePreset.id,
            name: stylePreset.name,
            style_config: stylePreset.style_config
          },
          width: 400,
          height: 400
        })

        reservedCodesData.push({
          code,
          batch_id: batchId,
          status: 'available' as const,
          sequence_number: sequenceNumber,
          export_id: exportId,
          pdf_generated: false,
          generation_settings: {
            style_preset_id: params.stylePresetId,
            style_preset: stylePreset.style_config,
            prefix: params.prefix,
            url
          },
          base_qr_svg: qrSvg,
          expires_at: expiresAt
        })
      } catch (error) {
        console.error(`Failed to generate QR for code ${code}:`, error)
        // Still create the record without SVG - can be generated later
        reservedCodesData.push({
          code,
          batch_id: batchId,
          status: 'available' as const,
          sequence_number: sequenceNumber,
          export_id: exportId,
          pdf_generated: false,
          generation_settings: {
            style_preset_id: params.stylePresetId,
            style_preset: stylePreset.style_config,
            prefix: params.prefix,
            url
          },
          base_qr_svg: null,
          expires_at: expiresAt
        })
      }
    }

    const { data, error } = await this.supabase
      .from('reserved_codes')
      .insert(reservedCodesData)
      .select()

    if (error) {
      throw new Error(`Failed to store reserved codes: ${error.message}`)
    }

    return data as ReservedCode[]
  }

  private async generateExportUrl(batchId: string): Promise<string> {
    // In a real implementation, this would generate a PDF or CSV export
    // For now, return a placeholder URL
    return `/api/admin/qr-codes/batches/${batchId}/export`
  }

  async getBatch(batchId: string): Promise<QRCodeBatch | null> {
    const { data, error } = await this.supabase
      .from('qr_code_batches')
      .select('*')
      .eq('id', batchId)
      .single()

    if (error) {
      console.error('Error fetching batch:', error)
      return null
    }

    return data as QRCodeBatch
  }

  async listBatches(): Promise<QRCodeBatch[]> {
    const { data, error } = await this.supabase
      .from('qr_code_batches')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error listing batches:', error)
      return []
    }

    return data as QRCodeBatch[]
  }

  async updateBatchStatus(batchId: string, status: QRCodeBatch['status']): Promise<boolean> {
    const updateData: Record<string, unknown> = { status }

    // Add timestamp fields based on status
    if (status === 'printed') updateData.printed_at = new Date()
    if (status === 'shipped') updateData.shipped_at = new Date()
    if (status === 'received') updateData.received_at = new Date()

    const { error } = await this.supabase
      .from('qr_code_batches')
      .update(updateData)
      .eq('id', batchId)

    if (error) {
      console.error('Error updating batch status:', error)
      return false
    }

    return true
  }

  async getCodesFromBatch(batchId: string): Promise<ReservedCode[]> {
    const { data, error } = await this.supabase
      .from('reserved_codes')
      .select('*')
      .eq('batch_id', batchId)
      .order('code', { ascending: true })

    if (error) {
      console.error('Error fetching codes from batch:', error)
      return []
    }

    return data as ReservedCode[]
  }
}