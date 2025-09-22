'use client'

import { css } from '@/styled-system/css'

interface VCardDownloadProps {
  businessName: string
  vCardData: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
  onClick?: () => void
}

export default function VCardDownload({
  businessName,
  vCardData,
  className,
  style,
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
    colorPalette: 'mint',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    px: 4,
    py: 2,
    bg: 'colorPalette.default',
    color: 'colorPalette.fg',
    fontWeight: 'medium',
    cursor: 'pointer',
    transition: 'colors',
    _hover: {
      bg: 'colorPalette.emphasized',
    },
    _focus: {
      outline: 'none',
      ringWidth: '2',
      ringColor: 'colorPalette.default',
      ringOffset: '2',
    },
  })

  return (
    <button
      onClick={downloadVCard}
      className={className || defaultStyles}
      style={style}
      type="button"
    >
      {children}
    </button>
  )
}