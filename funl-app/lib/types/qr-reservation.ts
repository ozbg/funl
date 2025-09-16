import { z } from 'zod'

// Batch generation schemas
export const generateBatchSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().min(1).max(10000),
  stylePresetId: z.string().uuid(),
  prefix: z.string().optional(),
  expiresInDays: z.number().int().min(1).optional(),
  description: z.string().optional(),
})

export type GenerateBatchRequest = z.infer<typeof generateBatchSchema>

export interface GenerateBatchResponse {
  batchId: string
  batchNumber: string
  codes: Array<{
    id: string
    code: string
    qrSvg?: string
  }>
  exportUrl?: string
}

// Code reservation schemas
export const reserveCodeSchema = z.object({
  businessId: z.string().uuid(),
  size: z.string().optional(),
  stylePresetId: z.string().uuid().optional(),
  duration: z.number().int().min(1).max(60).default(15), // minutes
})

export type ReserveCodeRequest = z.infer<typeof reserveCodeSchema>

export interface ReserveCodeResponse {
  reservationId: string
  codeId: string
  code: string
  expiresAt: Date
  qrPreview?: string
}

// Code allocation schemas
export const allocateCodeSchema = z.object({
  businessId: z.string().uuid(),
  funnelId: z.string().uuid(),
  codeId: z.string().uuid().optional(), // Optional - will auto-select if not provided
})

export type AllocateCodeRequest = z.infer<typeof allocateCodeSchema>

export interface AllocatedCode {
  id: string
  code: string
  status: 'assigned'
  funnelId: string
  businessId: string
  assignedAt: Date
}

// Print run schemas
export const createPrintRunSchema = z.object({
  reservedCodeId: z.string().uuid(),
  businessId: z.string().uuid(),
  funnelId: z.string().uuid().optional(),
  orders: z.array(z.object({
    size: z.enum(['25mm', '50mm', '75mm', '100mm', '150mm', '200mm', '300mm']),
    quantity: z.number().int().min(1),
    stylePresetId: z.string().uuid(),
    customizations: z.object({
      topText: z.string().optional(),
      bottomText: z.string().optional(),
      colors: z.object({
        dark: z.string().optional(),
        light: z.string().optional(),
      }).optional(),
      logo: z.string().optional(),
    }).optional(),
  })),
})

export type CreatePrintRunRequest = z.infer<typeof createPrintRunSchema>

export interface PrintRunResponse {
  printRuns: Array<{
    id: string
    size: string
    quantity: number
    qrCodeSvg?: string
    printFileUrl?: string
    unitCost: number
    totalCost: number
  }>
  totalCost: number
  estimatedDelivery?: Date
}

// Inventory schemas
export interface InventoryOverview {
  totalCodes: number
  availableCodes: number
  reservedCodes: number
  assignedCodes: number
  damagedCodes: number

  bySize: Record<string, number>
  byStyle: Record<string, number>

  lowStockAlerts: Array<{
    batchId: string
    batchNumber: string
    size: string
    available: number
    reorderPoint?: number
  }>
}

// Database types
export interface QRCodeBatch {
  id: string
  batch_number: string
  name: string
  description?: string
  quantity: number
  style_preset_id?: string
  status: 'generated' | 'exporting' | 'printing' | 'printed' | 'shipped' | 'received' | 'active' | 'depleted'
  quantity_available: number
  quantity_reserved: number
  quantity_assigned: number
  quantity_damaged: number
  sequence_counter: number
  export_settings: Record<string, unknown>
  created_at: Date
  updated_at: Date
}

export interface ReservedCode {
  id: string
  code: string
  batch_id: string
  status: 'available' | 'reserved' | 'assigned' | 'damaged' | 'expired' | 'lost'
  funnel_id?: string
  business_id?: string
  generation_settings: any
  base_qr_svg?: string
  reserved_at?: Date
  reserved_until?: Date
  assigned_at?: Date
  expires_at?: Date
  allocation_lock?: string
  allocation_locked_at?: Date
  location?: string
  serial_number?: string
  sequence_number?: number
  export_id?: string
  pdf_generated: boolean
  created_at: Date
  updated_at: Date
}

export interface CodePrintRun {
  id: string
  reserved_code_id: string
  size: string
  style_preset_id?: string
  quantity_ordered: number
  quantity_printed: number
  generation_settings: any
  qr_code_svg?: string
  order_id?: string
  business_id: string
  funnel_id?: string
  custom_message?: string
  status: 'ordered' | 'printing' | 'printed' | 'quality_check' | 'shipped' | 'delivered' | 'cancelled'
  unit_cost?: number
  total_cost?: number
  ordered_at: Date
  printed_at?: Date
  shipped_at?: Date
  delivered_at?: Date
  cancelled_at?: Date
  created_at: Date
  updated_at: Date
}

export interface CodeInventory {
  id: string
  batch_id?: string
  location_type: 'warehouse' | 'office' | 'fulfillment_center' | 'in_transit'
  location_name: string
  location_details?: any
  quantity_on_hand: number
  quantity_allocated: number
  quantity_available: number
  reorder_point?: number
  reorder_quantity?: number
  last_reorder_date?: Date
  last_counted_at?: Date
  last_counted_by?: string
  created_at: Date
  updated_at: Date
}

export interface CodeAllocation {
  id: string
  reserved_code_id: string
  action: 'reserve' | 'assign' | 'release' | 'expire' | 'damage' | 'return' | 'lock' | 'unlock' | 'transfer' | 'print' | 'reprint' | 'status_change'
  previous_status?: string
  new_status?: string
  business_id?: string
  funnel_id?: string
  admin_id?: string
  print_run_id?: string
  ip_address?: string
  user_agent?: string
  session_id?: string
  reason?: string
  metadata?: any
  error_message?: string
  is_successful: boolean
  validated_at?: Date
  validated_by?: string
  created_at: Date
}

// PDF Export types
export const pdfExportSizeSchema = z.object({
  size: z.enum(['25mm', '50mm', '75mm', '100mm', '150mm', '200mm']),
  customWidth: z.number().optional(),
  customHeight: z.number().optional(),
  textSize: z.enum(['tiny', 'small', 'medium', 'custom']),
  customTextSize: z.number().optional()
})

export type PDFExportSize = z.infer<typeof pdfExportSizeSchema>

export interface PDFExportRequest {
  batchId: string
  size: PDFExportSize['size']
  customWidth?: number
  customHeight?: number
  textSize: PDFExportSize['textSize']
  customTextSize?: number
  includeIdText: boolean
  overrideStylePresetId?: string
}

export interface PDFExportResponse {
  zipUrl: string
  totalCodes: number
  exportId: string
  filename: string
}

export interface ExportProgress {
  current: number
  total: number
  status: 'generating' | 'zipping' | 'complete' | 'error'
  message: string
}