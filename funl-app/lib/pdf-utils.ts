// PDF utility functions for client-side operations

import { PageSize, LayoutData } from '@/lib/types/layout'

export async function downloadLayoutPDF(
  pageSize: PageSize,
  data: LayoutData,
  filename?: string
): Promise<void> {
  try {
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageSize,
        data,
        filename: filename || `${data.business_name || 'layout'}-${pageSize}.pdf`
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to generate PDF')
    }

    // Create blob from response
    const pdfBlob = await response.blob()
    
    // Create download link
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `${data.business_name || 'layout'}-${pageSize}.pdf`
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Failed to download PDF:', error)
    throw error
  }
}

export function generatePDFFilename(
  businessName?: string, 
  funnelName?: string, 
  pageSize?: PageSize
): string {
  const parts = []
  
  if (businessName) {
    parts.push(businessName.replace(/[^a-zA-Z0-9]/g, '-'))
  }
  
  if (funnelName) {
    parts.push(funnelName.replace(/[^a-zA-Z0-9]/g, '-'))
  }
  
  if (pageSize) {
    parts.push(pageSize)
  }
  
  const filename = parts.length > 0 ? parts.join('-') : 'layout'
  return `${filename}.pdf`
}