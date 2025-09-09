import QRCode from 'qrcode'
import { nanoid } from 'nanoid'

export function generateShortId(): string {
  return nanoid(8) // 8 characters: ~98 million possible combinations
}

export function generateShortUrl(shortId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  return `${baseUrl}/f/${shortId}`
}

export async function generateQRCode(url: string, options?: { 
  darkColor?: string 
  lightColor?: string 
}): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      type: 'image/png',
      width: 400,
      margin: 2,
      color: {
        dark: options?.darkColor || '#000000',
        light: options?.lightColor || '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

export async function generateQRCodeBuffer(url: string, options?: { 
  darkColor?: string 
  lightColor?: string 
}): Promise<Buffer> {
  try {
    return await QRCode.toBuffer(url, {
      type: 'png',
      width: 400,
      margin: 2,
      color: {
        dark: options?.darkColor || '#000000',
        light: options?.lightColor || '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
  } catch (error) {
    console.error('Error generating QR code buffer:', error)
    throw new Error('Failed to generate QR code')
  }
}

export function generateVCard(data: {
  firstName: string
  lastName: string
  organization: string
  phone: string
  email: string
  website?: string
}): string {
  let vcard = 'BEGIN:VCARD\nVERSION:3.0\n'
  
  vcard += `FN:${data.firstName} ${data.lastName}\n`
  vcard += `N:${data.lastName};${data.firstName};;;\n`
  vcard += `ORG:${data.organization}\n`
  vcard += `TEL:${data.phone}\n`
  vcard += `EMAIL:${data.email}\n`
  
  if (data.website) {
    vcard += `URL:${data.website}\n`
  }
  
  vcard += 'END:VCARD'
  
  return vcard
}