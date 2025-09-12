import QRCode from 'qrcode'
import QRCodeStyling from 'qr-code-styling'
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

export async function generateQRCodeSVG(
  url: string, 
  options?: { 
    darkColor?: string 
    lightColor?: string
    width?: number
    style?: 'square' | 'rounded' | 'dots' | 'dots-rounded' | 'classy' | 'classy-rounded' | 'extra-rounded'
  }
): Promise<string> {
  try {
    console.log('🎯 Generating QR SVG with qr-code-styling, style:', options?.style)
    
    // Map our style names to qr-code-styling dot types
    const getDotsType = (style?: string) => {
      switch (style) {
        case 'rounded': return 'rounded'
        case 'dots': return 'dots'
        case 'dots-rounded': return 'extra-rounded'
        case 'classy': return 'classy'
        case 'classy-rounded': return 'classy-rounded'
        case 'extra-rounded': return 'extra-rounded'
        case 'square':
        default:
          return 'square'
      }
    }
    
    const width = options?.width || 300
    const height = width // Keep square
    
    console.log('📐 Generating QR with dimensions:', width, 'x', height)
    console.log('🎨 Using dot type:', getDotsType(options?.style))
    
    // Create QR code with qr-code-styling
    const qrCode = new QRCodeStyling({
      width: width,
      height: height,
      type: "svg",
      data: url,
      margin: 0, // No margin for better control
      qrOptions: {
        errorCorrectionLevel: 'M'
      },
      dotsOptions: {
        color: options?.darkColor || '#000000',
        type: getDotsType(options?.style)
      },
      backgroundOptions: {
        color: options?.lightColor || '#FFFFFF'
      },
      cornersSquareOptions: {
        type: getDotsType(options?.style),
        color: options?.darkColor || '#000000'
      },
      cornersDotOptions: {
        type: getDotsType(options?.style),
        color: options?.darkColor || '#000000'
      }
    })
    
    // Get the SVG as string
    const svgString = await new Promise<string>((resolve, reject) => {
      qrCode.getRawData('svg').then(async (buffer) => {
        if (buffer) {
          let svgText: string
          
          if (buffer instanceof Blob) {
            // Handle Blob case (browser environment)
            svgText = await buffer.text()
          } else {
            // Handle ArrayBuffer/Buffer case
            svgText = new TextDecoder().decode(buffer)
          }
          
          console.log('✅ QR SVG generated successfully, length:', svgText.length)
          console.log('🔍 SVG preview:', svgText.substring(0, 200) + '...')
          resolve(svgText)
        } else {
          reject(new Error('Failed to generate SVG buffer'))
        }
      }).catch(reject)
    })
    
    return svgString
  } catch (error) {
    console.error('Error generating QR code SVG with qr-code-styling:', error)
    throw new Error('Failed to generate QR code SVG')
  }
}

// Legacy path parsing code removed - no longer needed with qr-code-styling

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