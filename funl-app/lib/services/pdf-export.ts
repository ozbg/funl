import { generateQRCodeWithPreset } from '@/lib/qr-generation'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import type {
  ReservedCode,
  QRCodeBatch,
  PDFExportRequest,
  PDFExportResponse,
  ExportProgress
} from '@/lib/types/qr-reservation'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Size configurations for different QR code sizes
 */
const SIZE_CONFIGS = {
  '25mm': { width: 25, height: 25 },
  '50mm': { width: 50, height: 50 },
  '75mm': { width: 75, height: 75 },
  '100mm': { width: 100, height: 100 },
  '150mm': { width: 150, height: 150 },
  '200mm': { width: 200, height: 200 }
} as const

/**
 * Text size configurations in mm
 */
const TEXT_SIZE_CONFIGS = {
  'tiny': 2,
  'small': 3,
  'medium': 4
} as const

export class PDFExportService {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Export all QR codes from a batch as individual PDFs in a ZIP file
   */
  async exportBatchAsPDFs(request: PDFExportRequest): Promise<PDFExportResponse> {
    // Get batch details
    const batch = await this.getBatch(request.batchId)
    if (!batch) {
      throw new Error('Batch not found')
    }

    // Get all codes from the batch
    const codes = await this.getCodesFromBatch(request.batchId)
    if (codes.length === 0) {
      throw new Error('No codes found in batch')
    }

    // Generate PDFs for each code
    const pdfFiles: { name: string; data: Buffer }[] = []

    for (const code of codes) {
      try {
        console.log(`🔧 Generating PDF for code: ${code.code} (${code.export_id})`)

        const pdfData = await this.generateCodePDF(code, request, batch)
        const stylePreset = await this.getStylePreset(batch.style_preset_id!)
        const styleName = stylePreset?.name?.toLowerCase().replace(/\s+/g, '-') || 'default'

        const fileName = `${code.export_id}_${styleName}.pdf`
        console.log(`🔧 Generated PDF: ${fileName}, size: ${pdfData.length} bytes`)

        pdfFiles.push({
          name: fileName,
          data: pdfData
        })

        // Mark PDF as generated
        await this.markPDFGenerated(code.id)
        console.log(`✅ Successfully processed PDF for code: ${code.code}`)
      } catch (error) {
        console.error(`❌ Failed to generate PDF for code ${code.code}:`, error)
        console.error('Error details:', error instanceof Error ? error.stack : error)
        // Continue with other codes
      }
    }

    console.log(`🔧 Generated ${pdfFiles.length} PDF files out of ${codes.length} codes`)

    // Create ZIP archive
    const zipBuffer = await this.createZipArchive(pdfFiles)

    // Generate unique export filename
    const exportId = `export_${batch.batch_number}_${new Date().getTime()}`
    const zipFilename = `${exportId}.zip`

    // Save ZIP file to disk
    await this.saveZipFile(zipFilename, zipBuffer)

    const zipUrl = `/api/admin/qr-codes/exports/${zipFilename}`

    return {
      zipUrl,
      totalCodes: codes.length,
      exportId,
      filename: zipFilename
    }
  }

  /**
   * Generate individual PDF for a single QR code
   */
  private async generateCodePDF(
    code: ReservedCode,
    request: PDFExportRequest,
    batch: QRCodeBatch
  ): Promise<Buffer> {
    // Get size configuration
    const sizeConfig = request.customWidth && request.customHeight
      ? { width: request.customWidth, height: request.customHeight }
      : SIZE_CONFIGS[request.size]

    const textSize = request.customTextSize ||
      (request.textSize === 'custom' ? 3 : TEXT_SIZE_CONFIGS[request.textSize])

    // Get style preset (use override if provided, otherwise use batch default)
    const presetId = request.overrideStylePresetId || batch.style_preset_id!
    const stylePreset = await this.getStylePreset(presetId)
    if (!stylePreset) {
      throw new Error('Style preset not found')
    }

    // Generate the QR code URL
    const url = code.generation_settings.url || `${process.env.NEXT_PUBLIC_APP_URL}/f/${code.code}`
    console.log(`🔧 QR code URL: ${url}`)
    console.log(`🔧 Using style preset: ${stylePreset.name} (${presetId})`)

    // Clean up export ID: replace underscores with dashes
    const cleanIdText = (code.export_id || code.code).replace(/_/g, '-')

    // Create PDF with QR code and ID text if requested
    return await this.createPDFFromSVG('', sizeConfig, {
      includeIdText: request.includeIdText,
      idText: cleanIdText,
      textSize,
      qrUrl: url,
      stylePreset
    })
  }

  /**
   * Create PDF with actual QR code and optional ID text
   */
  private async createPDFFromSVG(
    svgContent: string,
    dimensions: { width: number; height: number },
    textOptions: {
      includeIdText: boolean
      idText: string
      textSize: number
      qrUrl: string
      stylePreset: unknown
    }
  ): Promise<Buffer> {
    try {
      console.log('🔧 Starting PDF generation...')

      // Import required libraries
      const { jsPDF } = await import('jspdf')

      // Create PDF with exact user-specified dimensions
      const pdf = new jsPDF({
        orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [dimensions.width, dimensions.height]
      })

      console.log(`🔧 Created PDF: ${dimensions.width}×${dimensions.height}mm`)

      // Calculate layout based on whether ID text is included
      const baseMargin = 2 // 2mm base margin
      const textHeight = textOptions.includeIdText ? textOptions.textSize : 0
      const textPadding = textOptions.includeIdText ? 2 : 0 // 2mm padding around text

      // Total margin includes: base margin + text height + text padding
      const totalMargin = baseMargin + textHeight + textPadding
      console.log(`🔧 Layout: ${dimensions.width}×${dimensions.height}mm, margin: ${totalMargin}mm, text: ${textHeight}mm`)

      // Calculate QR code size and position
      const qrSize = Math.min(
        dimensions.width - (totalMargin * 2),
        dimensions.height - (totalMargin * 2)
      )
      const qrX = (dimensions.width - qrSize) / 2
      const qrY = (dimensions.height - qrSize) / 2 - (textOptions.includeIdText ? textHeight / 2 + 1 : 0)

      console.log(`🔧 QR positioning: ${qrX}, ${qrY}, size: ${qrSize}mm`)

      // Generate styled QR code using the existing function
      console.log(`🔧 Generating QR code for URL: ${textOptions.qrUrl}`)
      console.log(`🔧 Using style preset: ${textOptions.stylePreset.name}`)

      const qrSvg = await generateQRCodeWithPreset({
        url: textOptions.qrUrl,
        preset: {
          id: textOptions.stylePreset.id,
          name: textOptions.stylePreset.name,
          style_config: textOptions.stylePreset.style_config
        },
        width: 400, // Fixed pixel size for consistent quality
        height: 400
      })

      console.log('🔧 Generated styled QR code SVG, length:', qrSvg.length)

      // Create complete SVG with embedded QR code SVG as a symbol and proper layout
      // ULTRA-AGGRESSIVE XML cleaning to ensure no XML declarations remain
      let cleanedQrSvg = qrSvg
        .replace(/<\?xml[^>]*\?>/g, '') // Remove XML declarations anywhere
        .replace(/^\s*<\?xml[^>]*\?>\s*/gm, '') // Remove leading XML declarations with multiline flag
        .replace(/[\s]*<\?xml[^>]*\?>[\s]*/g, '') // Remove XML declarations with surrounding whitespace
        .replace(/<svg[^>]*>/g, '<g>') // Convert SVG to group
        .replace(/<\/svg>/g, '</g>') // Close group

      // Ultra-aggressive final clean - keep removing until absolutely no XML declarations remain
      let iterations = 0
      while (cleanedQrSvg.includes('<?xml') && iterations < 10) {
        cleanedQrSvg = cleanedQrSvg
          .replace(/<\?xml[^>]*\?>/g, '')
          .replace(/\s*<\?xml[^>]*\?>\s*/g, '')
        iterations++
      }

      cleanedQrSvg = cleanedQrSvg.trim()

      let pdfSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}mm" height="${dimensions.height}mm" viewBox="0 0 ${dimensions.width} ${dimensions.height}">
        <g transform="translate(${qrX}, ${qrY}) scale(${qrSize / 300})">
          ${cleanedQrSvg}
        </g>`

      // Add ID text if requested
      // NOTE: For server-side rendering, we're using jsPDF's text() method instead of SVG text
      // to avoid getBBox issues with JSDOM. The text will be added after SVG conversion.

      pdfSvgContent += `</svg>`

      console.log('🔧 Created complete SVG content, length:', pdfSvgContent.length)

      // Use svg2pdf.js to convert SVG directly to PDF vectors - exactly like working sticker export
      console.log('🔧 Importing svg2pdf.js and jsdom...')

      const [{ svg2pdf }, { JSDOM }] = await Promise.all([
        import('svg2pdf.js'),
        import('jsdom')
      ])

      console.log('🔧 Successfully imported libraries')

      // Set up JSDOM environment exactly like working client-side code
      console.log('🔧 Setting up JSDOM environment...')
      const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
        pretendToBeVisual: true,
        resources: "usable"
      })

      // Set up global environment to match browser
      const window = dom.window
      global.document = window.document
      global.window = window as any
      global.DOMParser = window.DOMParser

      console.log('🔧 Parsing SVG with DOMParser (like working client-side code)...')

      // Use DOMParser exactly like the working client-side code (line 410-412 in QRLayoutPreview.tsx)
      const parser = new window.DOMParser()
      const svgDoc = parser.parseFromString(pdfSvgContent, 'image/svg+xml')
      const svgElement = svgDoc.documentElement

      if (!svgElement) {
        throw new Error('Failed to parse SVG - no svg element found')
      }

      console.log('🔧 SVG parsed with DOMParser, nodeName:', svgElement.nodeName)

      // Even if DOMParser reports "parsererror", svg2pdf might still work (we've seen this)
      // So we continue processing but log if there's an issue
      if (svgElement.nodeName === 'parsererror') {
        console.log('⚠️ DOMParser reports parsererror but attempting svg2pdf conversion anyway:', svgElement.textContent)
      } else if (svgElement.nodeName !== 'svg') {
        console.error('❌ Expected svg element, got:', svgElement.nodeName)
        throw new Error(`Expected svg element, got ${svgElement.nodeName}`)
      } else {
        console.log('✅ SVG parsed successfully with DOMParser')
      }

      // Convert SVG to PDF vectors - exactly like working client-side code (line 414)
      console.log('🔧 Converting SVG to PDF vectors...')
      await svg2pdf(svgElement, pdf)

      // Clean up globals
      delete (global as any).document
      delete (global as any).window
      delete (global as any).DOMParser

      console.log('🔧 Successfully converted SVG to PDF vectors')

      // Add ID text using jsPDF's native text method (avoids getBBox issues)
      if (textOptions.includeIdText) {
        pdf.setFontSize(textOptions.textSize * 2.835) // Convert mm to points (1mm = 2.835 points)
        pdf.setTextColor(128, 128, 128) // Gray color
        const textX = dimensions.width / 2
        const textY = dimensions.height - baseMargin
        pdf.text(textOptions.idText, textX, textY, { align: 'center' })
      }

      // Return PDF as buffer
      const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
      console.log(`✅ Vector PDF created: ${pdfBuffer.length} bytes`)

      return pdfBuffer
    } catch (error) {
      console.error('❌ Error creating PDF:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
      throw new Error(`Failed to create PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create ZIP archive from PDF files
   */
  private async createZipArchive(files: { name: string; data: Buffer }[]): Promise<Buffer> {
    try {
      console.log(`🔧 Creating ZIP archive with ${files.length} files`)

      if (files.length === 0) {
        throw new Error('No PDF files to archive')
      }

      const JSZip = await import('jszip')
      const zip = new JSZip.default()

      for (const file of files) {
        console.log(`🔧 Adding file to ZIP: ${file.name} (${file.data.length} bytes)`)
        zip.file(file.name, file.data)
      }

      console.log('🔧 Generating ZIP buffer...')
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
      console.log(`✅ ZIP archive created: ${zipBuffer.length} bytes`)

      return zipBuffer
    } catch (error) {
      console.error('❌ Error creating ZIP archive:', error)
      throw error
    }
  }

  /**
   * Get batch details
   */
  private async getBatch(batchId: string): Promise<QRCodeBatch | null> {
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

  /**
   * Get all codes from a batch
   */
  private async getCodesFromBatch(batchId: string): Promise<ReservedCode[]> {
    const { data, error } = await this.supabase
      .from('reserved_codes')
      .select('*')
      .eq('batch_id', batchId)
      .order('sequence_number', { ascending: true })

    if (error) {
      console.error('Error fetching codes from batch:', error)
      return []
    }

    return data as ReservedCode[]
  }

  /**
   * Get style preset details
   */
  private async getStylePreset(presetId: string) {
    const { data, error } = await this.supabase
      .from('qr_code_presets')
      .select('*')
      .eq('id', presetId)
      .single()

    if (error) {
      console.error('Error fetching style preset:', error)
      return null
    }

    return data
  }

  /**
   * Mark PDF as generated for a code
   */
  private async markPDFGenerated(codeId: string): Promise<void> {
    await this.supabase
      .from('reserved_codes')
      .update({ pdf_generated: true })
      .eq('id', codeId)
  }

  /**
   * Save ZIP file to disk
   */
  private async saveZipFile(filename: string, zipBuffer: Buffer): Promise<void> {
    const exportsDir = join(process.cwd(), 'temp', 'exports')

    // Ensure exports directory exists
    try {
      await mkdir(exportsDir, { recursive: true })
    } catch {
      // Directory might already exist, that's fine
    }

    const filePath = join(exportsDir, filename)
    await writeFile(filePath, zipBuffer)
  }

  /**
   * Get export progress (for future progress tracking)
   */
  async getExportProgress(exportId: string): Promise<ExportProgress | null> {
    // This would be implemented with a progress tracking system
    // For now, return null
    return null
  }
}