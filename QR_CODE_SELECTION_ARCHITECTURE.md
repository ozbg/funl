# QR Code Selection Architecture

## Overview
After funnel creation, users are presented with three paths for QR code management. This ensures flexibility, security, and proper tracking of pre-printed inventory.

## User Flow

### 1. Post-Funnel Creation Decision Point
After successfully creating a funnel, instead of going directly to sticker builder:
- Display a modal/page with three options
- Each option has clear benefits and use cases
- Guide users to the right choice based on their needs

### 2. Three Paths

#### Path A: Buy Pre-Printed Sticker
**For:** New businesses wanting quick, cost-effective solution
**Process:**
1. Show available pre-printed stickers (from `reserved_codes` with status='available')
2. Display sticker preview with actual size representations
3. User selects desired sticker
4. Show pricing and delivery estimate
5. Confirm purchase → Allocate code to funnel
6. Update `reserved_codes` status to 'assigned'
7. Create order record for fulfillment

#### Path B: Roll Your Own (Current Sticker Builder)
**For:** Businesses wanting custom design/immediate digital access
**Process:**
1. Continue to existing sticker builder
2. Generate custom QR code on-demand
3. Customize design, colors, text
4. Download/print themselves
5. Higher cost but immediate access

#### Path C: Connect Existing Sticker
**For:** Businesses with previously purchased stickers
**Process:**
1. Show list of user's purchased codes (status='purchased' for their business_id)
2. Alternative: Scan QR code with device camera
3. Verify ownership before connection
4. Connect to funnel
5. Update status to 'assigned'

## Database Schema Updates

### 1. Enhanced `reserved_codes` Table
```sql
-- Add purchase tracking
ALTER TABLE reserved_codes ADD COLUMN purchase_order_id UUID REFERENCES purchase_orders(id);
ALTER TABLE reserved_codes ADD COLUMN purchased_at TIMESTAMPTZ;
ALTER TABLE reserved_codes ADD COLUMN purchase_price DECIMAL(10,2);

-- Enhanced status values
ALTER TABLE reserved_codes DROP CONSTRAINT reserved_codes_status_check;
ALTER TABLE reserved_codes ADD CONSTRAINT reserved_codes_status_check
  CHECK (status IN ('available', 'reserved', 'purchased', 'assigned', 'damaged', 'lost'));

-- Add verification token for secure connection
ALTER TABLE reserved_codes ADD COLUMN verification_token TEXT;
ALTER TABLE reserved_codes ADD COLUMN verification_expires_at TIMESTAMPTZ;
```

### 2. New `purchase_orders` Table
```sql
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  order_number TEXT UNIQUE NOT NULL,

  -- Order details
  items JSONB NOT NULL, -- Array of {code_id, quantity, price, size}
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  shipping DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_intent_id TEXT, -- Stripe payment intent

  -- Shipping
  shipping_address JSONB,
  tracking_number TEXT,
  carrier TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);
```

### 3. New `user_sticker_inventory` Table
```sql
CREATE TABLE user_sticker_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  reserved_code_id UUID NOT NULL REFERENCES reserved_codes(id),

  -- Acquisition
  acquired_via TEXT NOT NULL CHECK (acquired_via IN ('purchase', 'gift', 'promotion', 'sample')),
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  purchase_order_id UUID REFERENCES purchase_orders(id),

  -- Usage
  is_used BOOLEAN DEFAULT false,
  used_for_funnel_id UUID REFERENCES funnels(id),
  used_at TIMESTAMPTZ,

  -- Physical tracking
  physical_location TEXT, -- e.g., "Office drawer", "Reception desk"
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(business_id, reserved_code_id)
);
```

## Security Architecture

### 1. Code Connection Security
```typescript
interface CodeConnectionSecurity {
  // Method 1: Pre-purchased list
  showPurchasedCodes: {
    verification: 'database_ownership', // Check business_id match
    requirement: 'authenticated_user',
    risk_level: 'low'
  },

  // Method 2: QR Code Scanning
  scanQRCode: {
    verification: 'two_factor', // Require additional verification
    steps: [
      'scan_qr_code',
      'extract_short_code',
      'verify_ownership', // Check if code belongs to user
      'send_verification_email', // Send email with 6-digit code
      'verify_email_code',
      'connect_to_funnel'
    ],
    risk_level: 'medium'
  },

  // Method 3: Manual Code Entry
  manualEntry: {
    verification: 'enhanced', // Most strict
    steps: [
      'enter_code',
      'show_preview', // Show QR preview for visual confirmation
      'confirm_ownership', // "Is this your sticker?"
      'verify_purchase_history', // Check purchase records
      'admin_approval' // For suspicious cases
    ],
    risk_level: 'high'
  }
}
```

### 2. Anti-Fraud Measures
```typescript
class CodeVerificationService {
  // Prevent typos and accidental connections
  async verifyCodeOwnership(businessId: string, code: string): Promise<VerificationResult> {
    // 1. Check if code exists
    const reserved = await db.reserved_codes.findByCode(code)
    if (!reserved) return { valid: false, reason: 'Code not found' }

    // 2. Check ownership
    if (reserved.business_id !== businessId) {
      // Log potential fraud attempt
      await this.logSecurityEvent('unauthorized_code_access', { businessId, code })
      return { valid: false, reason: 'Code belongs to another user' }
    }

    // 3. Check if already assigned
    if (reserved.status === 'assigned' && reserved.funnel_id) {
      return { valid: false, reason: 'Code already connected to a funnel' }
    }

    // 4. Generate verification token
    const token = generateSecureToken()
    await db.reserved_codes.update(reserved.id, {
      verification_token: token,
      verification_expires_at: addMinutes(new Date(), 15)
    })

    // 5. Send verification email
    await emailService.sendCodeVerification(businessId, code, token)

    return { valid: true, requires_verification: true, method: 'email' }
  }

  // Rate limiting
  private rateLimiter = new RateLimiter({
    max_attempts: 5,
    window_minutes: 15,
    lockout_minutes: 60
  })

  // Audit logging
  async logSecurityEvent(event: string, details: any) {
    await db.security_logs.create({
      event,
      details,
      ip_address: request.ip,
      user_agent: request.headers['user-agent'],
      timestamp: new Date()
    })
  }
}
```

## UI Components

### 1. Code Selection Modal
```typescript
interface CodeSelectionModalProps {
  funnelId: string
  onComplete: () => void
}

const CodeSelectionModal: React.FC = ({ funnelId, onComplete }) => {
  return (
    <Dialog>
      <DialogHeader>
        <DialogTitle>Choose How to Get Your QR Sticker</DialogTitle>
        <DialogDescription>
          Select the option that best fits your needs
        </DialogDescription>
      </DialogHeader>

      <DialogContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Buy Pre-Printed */}
          <Card className="cursor-pointer hover:border-primary">
            <CardHeader>
              <Badge className="w-fit">Most Popular</Badge>
              <CardTitle>Buy Pre-Printed Sticker</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✓ Professional quality</li>
                <li>✓ Weatherproof material</li>
                <li>✓ Ships in 2-3 days</li>
                <li>✓ From $0.50/sticker</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate('/buy-sticker')}>
                Browse Stickers
              </Button>
            </CardFooter>
          </Card>

          {/* Roll Your Own */}
          <Card className="cursor-pointer hover:border-primary">
            <CardHeader>
              <CardTitle>Design Your Own</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✓ Full customization</li>
                <li>✓ Instant download</li>
                <li>✓ Print anywhere</li>
                <li>✓ From $5/design</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate('/sticker-builder')}>
                Open Designer
              </Button>
            </CardFooter>
          </Card>

          {/* Connect Existing */}
          <Card className="cursor-pointer hover:border-primary">
            <CardHeader>
              <CardTitle>Connect Existing</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✓ Use purchased stickers</li>
                <li>✓ Quick setup</li>
                <li>✓ Secure verification</li>
                <li>✓ No additional cost</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate('/connect-sticker')}>
                Connect Sticker
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### 2. Buy Sticker Page
```typescript
const BuyStickerPage = () => {
  const [selectedSticker, setSelectedSticker] = useState(null)
  const [previewSize, setPreviewSize] = useState('medium')

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Choose Your QR Sticker</h1>

      {/* Available Stickers Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {availableStickers.map(sticker => (
          <StickerCard
            key={sticker.id}
            sticker={sticker}
            selected={selectedSticker?.id === sticker.id}
            onClick={() => setSelectedSticker(sticker)}
          />
        ))}
      </div>

      {/* Selected Sticker Preview */}
      {selectedSticker && (
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Preview</h2>
            <StickerPreview
              code={selectedSticker.code}
              size={previewSize}
              showActualSize={true}
            />

            {/* Size Selector */}
            <div className="mt-4">
              <label>View Size:</label>
              <select
                value={previewSize}
                onChange={(e) => setPreviewSize(e.target.value)}
              >
                <option value="small">25mm x 25mm</option>
                <option value="medium">50mm x 50mm</option>
                <option value="large">75mm x 75mm</option>
                <option value="xlarge">100mm x 100mm</option>
              </select>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Order Details</h2>
            <OrderSummary
              sticker={selectedSticker}
              quantity={1}
              shipping="standard"
            />

            <Button
              className="w-full mt-4"
              onClick={() => confirmPurchase(selectedSticker)}
            >
              Confirm Purchase - $4.99
            </Button>

            <p className="text-sm text-gray-500 mt-2">
              Includes shipping. Arrives in 2-3 business days.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 3. Connect Sticker Page
```typescript
const ConnectStickerPage = () => {
  const [connectionMethod, setConnectionMethod] = useState<'list' | 'scan' | 'manual'>('list')
  const [verificationStep, setVerificationStep] = useState<'select' | 'verify' | 'complete'>('select')

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Connect Your Sticker</h1>

      {/* Method Selector */}
      <Tabs value={connectionMethod} onValueChange={setConnectionMethod}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">My Stickers</TabsTrigger>
          <TabsTrigger value="scan">Scan QR</TabsTrigger>
          <TabsTrigger value="manual">Enter Code</TabsTrigger>
        </TabsList>

        {/* List Method */}
        <TabsContent value="list">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select from your purchased stickers:
            </p>
            {purchasedStickers.map(sticker => (
              <div
                key={sticker.id}
                className="border rounded-lg p-4 hover:border-primary cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Code: {sticker.code}</p>
                    <p className="text-sm text-gray-500">
                      Purchased {format(sticker.purchased_at, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => connectSticker(sticker)}>
                    Connect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Scan Method */}
        <TabsContent value="scan">
          <div className="space-y-4">
            <QRScanner
              onScan={(code) => handleScannedCode(code)}
              onError={(error) => showError(error)}
            />
            <Alert>
              <AlertDescription>
                Position your sticker within the frame. We'll verify ownership
                before connecting it to your funnel.
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>

        {/* Manual Method */}
        <TabsContent value="manual">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Enter Sticker Code
              </label>
              <input
                type="text"
                placeholder="e.g., ABC123XY"
                className="w-full px-3 py-2 border rounded-md"
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              />
              <p className="text-xs text-gray-500 mt-1">
                The 8-character code printed below your QR code
              </p>
            </div>

            {manualCode && (
              <Alert>
                <AlertDescription>
                  For security, we'll send a verification code to your email
                  after validating this sticker belongs to you.
                </AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full"
              onClick={() => verifyManualCode(manualCode)}
            >
              Verify Ownership
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Verification Step */}
      {verificationStep === 'verify' && (
        <VerificationDialog
          method={connectionMethod}
          onVerified={() => setVerificationStep('complete')}
        />
      )}

      {/* Success Step */}
      {verificationStep === 'complete' && (
        <SuccessMessage
          message="Sticker connected successfully!"
          onContinue={() => router.push('/dashboard')}
        />
      )}
    </div>
  )
}
```

## API Endpoints

### 1. Buy Sticker Flow
```typescript
// GET /api/stickers/available
// Returns available pre-printed stickers
export async function GET() {
  const stickers = await db.reserved_codes
    .where({ status: 'available' })
    .limit(20)
    .orderBy('created_at', 'desc')

  return NextResponse.json({ stickers })
}

// POST /api/stickers/purchase
// Purchase and allocate sticker to funnel
export async function POST(req: Request) {
  const { stickerId, funnelId, shippingAddress } = await req.json()

  return await db.transaction(async (trx) => {
    // 1. Lock the sticker
    const sticker = await trx.reserved_codes
      .where({ id: stickerId, status: 'available' })
      .forUpdate()
      .first()

    if (!sticker) throw new Error('Sticker not available')

    // 2. Create purchase order
    const order = await trx.purchase_orders.create({
      business_id: user.id,
      order_number: generateOrderNumber(),
      items: [{ code_id: stickerId, quantity: 1, price: 4.99 }],
      total: 4.99,
      shipping_address: shippingAddress
    })

    // 3. Update sticker status
    await trx.reserved_codes.update(stickerId, {
      status: 'assigned',
      business_id: user.id,
      funnel_id: funnelId,
      purchase_order_id: order.id,
      purchased_at: new Date()
    })

    // 4. Update funnel
    await trx.funnels.update(funnelId, {
      reserved_code_id: stickerId,
      code_source: 'reserved'
    })

    return { order, sticker }
  })
}
```

### 2. Connect Sticker Flow
```typescript
// POST /api/stickers/verify
// Verify sticker ownership
export async function POST(req: Request) {
  const { code, method } = await req.json()

  // Rate limiting
  if (!rateLimiter.check(user.id)) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  }

  const sticker = await db.reserved_codes.findByCode(code)

  if (!sticker) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 404 })
  }

  // Check ownership
  if (sticker.business_id !== user.id) {
    await logSecurityEvent('unauthorized_access', { code, user: user.id })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Generate verification token
  const token = generateToken()
  await db.reserved_codes.update(sticker.id, {
    verification_token: token,
    verification_expires_at: addMinutes(new Date(), 15)
  })

  // Send verification email
  if (method === 'manual' || method === 'scan') {
    await sendVerificationEmail(user.email, token)
    return NextResponse.json({ requires_verification: true })
  }

  return NextResponse.json({ verified: true, stickerId: sticker.id })
}

// POST /api/stickers/connect
// Connect verified sticker to funnel
export async function POST(req: Request) {
  const { stickerId, funnelId, verificationToken } = await req.json()

  return await db.transaction(async (trx) => {
    const sticker = await trx.reserved_codes
      .where({ id: stickerId })
      .first()

    // Verify token if required
    if (verificationToken) {
      if (sticker.verification_token !== verificationToken) {
        throw new Error('Invalid verification token')
      }
      if (new Date() > sticker.verification_expires_at) {
        throw new Error('Verification token expired')
      }
    }

    // Update sticker
    await trx.reserved_codes.update(stickerId, {
      status: 'assigned',
      funnel_id: funnelId,
      assigned_at: new Date(),
      verification_token: null,
      verification_expires_at: null
    })

    // Update funnel
    await trx.funnels.update(funnelId, {
      reserved_code_id: stickerId,
      code_source: 'reserved',
      short_url: sticker.code
    })

    // Update inventory
    await trx.user_sticker_inventory.update(
      { business_id: user.id, reserved_code_id: stickerId },
      { is_used: true, used_for_funnel_id: funnelId, used_at: new Date() }
    )

    return { success: true }
  })
}
```

## Implementation Plan

### Phase 1: Core Infrastructure (Day 1)
1. ✅ Database schema updates
2. ✅ Security service implementation
3. ✅ Basic API endpoints

### Phase 2: UI Components (Day 2)
1. ⏳ Code selection modal
2. ⏳ Buy sticker page
3. ⏳ Connect sticker page
4. ⏳ Verification flows

### Phase 3: Integration (Day 3)
1. ⏳ Update funnel creation flow
2. ⏳ Inventory management
3. ⏳ Order processing

### Phase 4: Testing & Security (Day 4)
1. ⏳ Security testing
2. ⏳ Rate limiting verification
3. ⏳ Error handling
4. ⏳ Audit logging

## Success Metrics

1. **Security**
   - Zero unauthorized code connections
   - < 0.1% fraud rate
   - 100% audit trail coverage

2. **User Experience**
   - < 30 seconds to connect existing sticker
   - < 2 minutes to purchase new sticker
   - 95% success rate on first attempt

3. **Business Impact**
   - 40% adoption of pre-printed option
   - 60% cost reduction per sticker
   - 80% reduction in fulfillment time