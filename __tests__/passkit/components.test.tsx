/**
 * PassKit Components Tests
 *
 * Unit tests for PassKit React components
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import { PassKitToggle } from '../../components/passkit/PassKitToggle'
import { PassPreview } from '../../components/passkit/PassPreview'
import { PassConfigurationPanel } from '../../components/passkit/PassConfigurationPanel'
import type { Funnel, Business, WalletPassConfig } from '../../lib/types'

// Mock data
const mockFunnel: Funnel = {
  id: 'test-funnel-id',
  business_id: 'test-business-id',
  name: 'Test Property Listing',
  type: 'property-listing',
  status: 'active',
  template_id: null,
  qr_code_url: 'https://example.com/qr',
  short_url: 'https://funl.app/f/test',
  content: {
    state: 'for_sale',
    price: '$750,000',
    property_url: 'https://example.com/property',
    custom_message: 'Beautiful family home'
  },
  wallet_pass_enabled: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockBusiness: Business = {
  id: 'test-business-id',
  email: 'test@example.com',
  name: 'Test Real Estate Agency',
  type: 'agency',
  phone: '+1-555-123-4567',
  website: 'https://testrealestate.com',
  vcard_data: {
    firstName: 'John',
    lastName: 'Doe',
    organization: 'Test Real Estate Agency',
    phone: '+1-555-123-4567',
    email: 'john.doe@testrealestate.com',
    website: 'https://testrealestate.com'
  },
  accent_color: '#0066cc',
  subscription_status: 'active',
  subscription_tier: 'pro',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockConfig: Partial<WalletPassConfig> = {
  enabled: true,
  backgroundColor: '#ffffff',
  foregroundColor: '#000000',
  showPropertyFeatures: true,
  showPriceHistory: false,
  maxDescriptionLength: 200
}

describe('PassKitToggle', () => {
  it('renders correctly when PassKit is disabled', () => {
    const mockOnToggle = jest.fn()

    render(
      <PassKitToggle
        funnel={mockFunnel}
        onToggle={mockOnToggle}
      />
    )

    expect(screen.getByText('Apple Wallet Pass')).toBeInTheDocument()
    expect(screen.getByText(/Allow users to add this property/)).toBeInTheDocument()
    expect(screen.queryByText('Wallet passes enabled')).not.toBeInTheDocument()
  })

  it('renders correctly when PassKit is enabled', () => {
    const enabledFunnel = { ...mockFunnel, wallet_pass_enabled: true }
    const mockOnToggle = jest.fn()

    render(
      <PassKitToggle
        funnel={enabledFunnel}
        onToggle={mockOnToggle}
      />
    )

    expect(screen.getByText('Wallet passes enabled')).toBeInTheDocument()
  })

  it('calls onToggle when clicked', async () => {
    const mockOnToggle = jest.fn().mockResolvedValue(undefined)

    render(
      <PassKitToggle
        funnel={mockFunnel}
        onToggle={mockOnToggle}
      />
    )

    const toggleButton = screen.getByRole('button')
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(mockOnToggle).toHaveBeenCalledWith(true)
    })
  })

  it('shows loading state during toggle', async () => {
    const mockOnToggle = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )

    render(
      <PassKitToggle
        funnel={mockFunnel}
        onToggle={mockOnToggle}
      />
    )

    const toggleButton = screen.getByRole('button')
    fireEvent.click(toggleButton)

    // Should show loading indicator
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('handles disabled state', () => {
    const mockOnToggle = jest.fn()

    render(
      <PassKitToggle
        funnel={mockFunnel}
        onToggle={mockOnToggle}
        disabled={true}
      />
    )

    const toggleButton = screen.getByRole('button')
    expect(toggleButton).toBeDisabled()

    fireEvent.click(toggleButton)
    expect(mockOnToggle).not.toHaveBeenCalled()
  })
})

describe('PassPreview', () => {
  it('renders pass preview with funnel data', () => {
    render(
      <PassPreview
        funnel={mockFunnel}
        business={mockBusiness}
        config={mockConfig}
      />
    )

    expect(screen.getByText('Pass Preview')).toBeInTheDocument()
    expect(screen.getByText('Apple Wallet')).toBeInTheDocument()
    expect(screen.getByText(mockBusiness.name)).toBeInTheDocument()
  })

  it('displays property listing specific fields', () => {
    render(
      <PassPreview
        funnel={mockFunnel}
        business={mockBusiness}
        config={mockConfig}
      />
    )

    expect(screen.getByText('$750,000')).toBeInTheDocument()
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('applies custom configuration colors', () => {
    const customConfig = {
      ...mockConfig,
      backgroundColor: '#ff0000',
      foregroundColor: '#ffffff'
    }

    render(
      <PassPreview
        funnel={mockFunnel}
        business={mockBusiness}
        config={customConfig}
      />
    )

    const passCard = screen.getByText('Pass Preview').parentElement?.querySelector('[style*="background-color"]')
    expect(passCard).toHaveStyle('background-color: #ff0000')
    expect(passCard).toHaveStyle('color: #ffffff')
  })

  it('shows configuration summary', () => {
    render(
      <PassPreview
        funnel={mockFunnel}
        business={mockBusiness}
        config={mockConfig}
      />
    )

    expect(screen.getByText('Configuration Summary')).toBeInTheDocument()
    expect(screen.getByText('Background: #ffffff')).toBeInTheDocument()
    expect(screen.getByText('Text Color: #000000')).toBeInTheDocument()
  })
})

describe('PassConfigurationPanel', () => {
  const mockProps = {
    funnelId: 'test-funnel-id',
    initialConfig: mockConfig,
    onConfigChange: jest.fn(),
    onSave: jest.fn().mockResolvedValue(undefined)
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders configuration form', () => {
    render(<PassConfigurationPanel {...mockProps} />)

    expect(screen.getByText('Pass Configuration')).toBeInTheDocument()
    expect(screen.getByLabelText('Background Color')).toBeInTheDocument()
    expect(screen.getByLabelText('Text Color')).toBeInTheDocument()
    expect(screen.getByLabelText('Show property features')).toBeInTheDocument()
  })

  it('initializes with provided config', () => {
    render(<PassConfigurationPanel {...mockProps} />)

    const backgroundInput = screen.getByDisplayValue('#ffffff')
    const foregroundInput = screen.getByDisplayValue('#000000')

    expect(backgroundInput).toBeInTheDocument()
    expect(foregroundInput).toBeInTheDocument()
  })

  it('calls onConfigChange when values change', async () => {
    render(<PassConfigurationPanel {...mockProps} />)

    const backgroundInput = screen.getByDisplayValue('#ffffff')
    fireEvent.change(backgroundInput, { target: { value: '#ff0000' } })

    await waitFor(() => {
      expect(mockProps.onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({
          backgroundColor: '#ff0000'
        })
      )
    })
  })

  it('handles checkbox changes', async () => {
    render(<PassConfigurationPanel {...mockProps} />)

    const checkbox = screen.getByLabelText('Show price history')
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(mockProps.onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({
          showPriceHistory: true
        })
      )
    })
  })

  it('shows save button state', async () => {
    render(<PassConfigurationPanel {...mockProps} />)

    const saveButton = screen.getByText('Save Configuration')
    expect(saveButton).toBeInTheDocument()

    // Change a value to enable save button
    const backgroundInput = screen.getByDisplayValue('#ffffff')
    fireEvent.change(backgroundInput, { target: { value: '#ff0000' } })

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    })

    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalled()
    })
  })

  it('shows unsaved changes warning', async () => {
    render(<PassConfigurationPanel {...mockProps} />)

    const backgroundInput = screen.getByDisplayValue('#ffffff')
    fireEvent.change(backgroundInput, { target: { value: '#ff0000' } })

    await waitFor(() => {
      expect(screen.getByText(/You have unsaved changes/)).toBeInTheDocument()
    })
  })

  it('handles disabled state', () => {
    render(<PassConfigurationPanel {...mockProps} disabled={true} />)

    const backgroundInput = screen.getByDisplayValue('#ffffff')
    const saveButton = screen.getByText('Save Configuration')

    expect(backgroundInput).toBeDisabled()
    expect(saveButton).toBeDisabled()
  })

  it('validates URL inputs', async () => {
    render(<PassConfigurationPanel {...mockProps} />)

    const logoInput = screen.getByPlaceholderText('https://example.com/logo.png')
    fireEvent.change(logoInput, { target: { value: 'invalid-url' } })

    // Should still update config (validation happens on server)
    await waitFor(() => {
      expect(mockProps.onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({
          logoUrl: 'invalid-url'
        })
      )
    })
  })

  it('handles number input for description length', async () => {
    render(<PassConfigurationPanel {...mockProps} />)

    const lengthInput = screen.getByDisplayValue('200')
    fireEvent.change(lengthInput, { target: { value: '150' } })

    await waitFor(() => {
      expect(mockProps.onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({
          maxDescriptionLength: 150
        })
      )
    })
  })
})