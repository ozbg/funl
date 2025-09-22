import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Rate limiting map (simple in-memory for now)
const rateLimitMap = new Map<string, { attempts: number; resetAt: Date }>()

function checkRateLimit(userId: string): boolean {
  const now = new Date()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || userLimit.resetAt < now) {
    rateLimitMap.set(userId, {
      attempts: 1,
      resetAt: new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes
    })
    return true
  }

  if (userLimit.attempts >= 5) {
    return false
  }

  userLimit.attempts++
  return true
}

function generateVerificationToken(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase() // 6-character hex token
}

// POST /api/stickers/verify - Verify sticker ownership
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }

    const { code, method } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    // Find the sticker by code
    const { data: sticker, error: stickerError } = await supabase
      .from('reserved_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (stickerError || !sticker) {
      // Log potential fraud attempt
      await supabase.from('security_logs').insert({
        event: 'invalid_code_attempt',
        details: { code, user_id: user.id, method },
        business_id: user.id,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      })

      return NextResponse.json({ error: 'Invalid code' }, { status: 404 })
    }

    // Check ownership for purchased stickers
    if (sticker.status === 'purchased' && sticker.business_id !== user.id) {
      // Log unauthorized access attempt
      await supabase.from('security_logs').insert({
        event: 'unauthorized_code_access',
        details: { code, user_id: user.id, owner_id: sticker.business_id, method },
        business_id: user.id,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      })

      return NextResponse.json({ error: 'This sticker belongs to another user' }, { status: 403 })
    }

    // Check if already assigned
    if (sticker.status === 'assigned' && sticker.funnel_id) {
      if (sticker.business_id === user.id) {
        return NextResponse.json({ error: 'This sticker is already connected to a funnel' }, { status: 409 })
      } else {
        return NextResponse.json({ error: 'This sticker is not available' }, { status: 409 })
      }
    }

    // For manual or scan methods, require additional verification
    if (method === 'manual' || method === 'scan') {
      const token = generateVerificationToken()
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

      // Update sticker with verification token
      const { error: updateError } = await supabase
        .from('reserved_codes')
        .update({
          verification_token: token,
          verification_expires_at: expiresAt.toISOString()
        })
        .eq('id', sticker.id)

      if (updateError) {
        console.error('Failed to set verification token:', updateError)
        return NextResponse.json({ error: 'Verification setup failed' }, { status: 500 })
      }

      // TODO: Send verification email
      // For now, we'll return the token in development
      console.log(`Verification token for ${user.email}: ${token}`)

      // Log verification request
      await supabase.from('security_logs').insert({
        event: 'verification_requested',
        details: { code, method, sticker_id: sticker.id },
        business_id: user.id,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      })

      return NextResponse.json({
        requires_verification: true,
        token: process.env.NODE_ENV === 'development' ? token : undefined // Only in dev
      })
    }

    // For list method, direct verification is successful
    return NextResponse.json({
      verified: true,
      stickerId: sticker.id
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}