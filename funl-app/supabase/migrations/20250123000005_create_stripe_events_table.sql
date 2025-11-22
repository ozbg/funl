-- Migration: Create stripe_events table
-- Provides idempotency for webhook event processing

CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  api_version TEXT,
  resource_id TEXT,
  resource_type TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient webhook processing
CREATE INDEX idx_stripe_events_event_id ON stripe_events(stripe_event_id);
CREATE INDEX idx_stripe_events_resource_id ON stripe_events(resource_id);
CREATE INDEX idx_stripe_events_processed ON stripe_events(processed) WHERE NOT processed;
CREATE INDEX idx_stripe_events_type ON stripe_events(event_type);
CREATE INDEX idx_stripe_events_created ON stripe_events(created_at DESC);

-- Comments
COMMENT ON TABLE stripe_events IS 'Idempotency log for Stripe webhook events';
COMMENT ON COLUMN stripe_events.stripe_event_id IS 'Stripe Event ID (evt_...)';
COMMENT ON COLUMN stripe_events.event_type IS 'Stripe event type (e.g. payment_intent.succeeded)';
COMMENT ON COLUMN stripe_events.api_version IS 'Stripe API version used';
COMMENT ON COLUMN stripe_events.resource_id IS 'ID of the resource (e.g. pi_..., ch_...)';
COMMENT ON COLUMN stripe_events.resource_type IS 'Type of resource (e.g. payment_intent, charge)';
COMMENT ON COLUMN stripe_events.payload IS 'Full event payload from Stripe';
COMMENT ON COLUMN stripe_events.processed IS 'Whether this event has been processed';
COMMENT ON COLUMN stripe_events.processed_at IS 'When the event was processed';
COMMENT ON COLUMN stripe_events.error IS 'Error message if processing failed';

-- Enable RLS
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all events
CREATE POLICY "Admins can view stripe events"
ON stripe_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid()
  )
);

-- Policy: Service role can manage events (for webhooks)
-- Note: This is handled via service role key, not RLS
