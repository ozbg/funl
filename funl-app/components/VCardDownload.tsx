'use client'

import { css } from '@/styled-system/css'

interface VCardData {
  firstName: string
  lastName: string
  organization: string
  phone: string
  email: string
  website?: string
}

interface VCardDownloadProps {
  businessName: string
  vCardData: string
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

export default function VCardDownload({ 
  businessName, 
  vCardData, 
  className,
  children,
  onClick
}: VCardDownloadProps) {
  const downloadVCard = () => {
    const blob = new Blob([vCardData], { type: 'text/vcard' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${businessName.replace(/[^a-zA-Z0-9]/g, '_')}.vcf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    // Call tracking callback
    onClick?.()
  }

  const defaultStyles = css({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    px: 4,
    py: 2,
    bg: 'accent.default',
    color: 'white',
    fontWeight: 'medium',
    borderRadius: 'none',
    cursor: 'pointer',
    transition: 'colors',
    _hover: {
      bg: 'accent.emphasis',
    },
    _focus: {
      outline: 'none',
      ringWidth: '2px',
      ringColor: 'accent.default',
      ringOffset: '2px',
    },
  })

  return (
    <button
      onClick={downloadVCard}
      className={className || defaultStyles}
      type="button"
    >
      {children}
    </button>
  )
}