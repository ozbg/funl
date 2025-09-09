-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Business accounts table
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('individual', 'agency')) DEFAULT 'individual',
  phone TEXT,
  website TEXT,
  vcard_data JSONB DEFAULT '{}',
  subscription_status TEXT CHECK (subscription_status IN ('trial', 'active', 'cancelled')) DEFAULT 'trial',
  subscription_tier TEXT CHECK (subscription_tier IN ('basic', 'pro', 'enterprise')) DEFAULT 'basic',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funnels table
CREATE TABLE funnels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('contact', 'property', 'video')) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'archived')) DEFAULT 'draft',
  template_id TEXT,
  qr_code_url TEXT,
  short_url TEXT UNIQUE,
  content JSONB DEFAULT '{}',
  print_size TEXT CHECK (print_size IN ('A4', 'A5')) DEFAULT 'A4',
  print_status TEXT CHECK (print_status IN ('pending', 'processing', 'shipped')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Click events table for analytics
CREATE TABLE click_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funnel_id UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  action TEXT CHECK (action IN ('view', 'vcard_download', 'callback_request', 'link_click')) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Callback requests table
CREATE TABLE callback_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funnel_id UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_time TEXT,
  message TEXT,
  status TEXT CHECK (status IN ('pending', 'contacted', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_funnels_business_id ON funnels(business_id);
CREATE INDEX idx_funnels_status ON funnels(status);
CREATE INDEX idx_funnels_short_url ON funnels(short_url);
CREATE INDEX idx_click_events_funnel_id ON click_events(funnel_id);
CREATE INDEX idx_click_events_created_at ON click_events(created_at);
CREATE INDEX idx_callback_requests_funnel_id ON callback_requests(funnel_id);
CREATE INDEX idx_callback_requests_status ON callback_requests(status);

-- Row Level Security (RLS) Policies
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE callback_requests ENABLE ROW LEVEL SECURITY;

-- Business policies
CREATE POLICY "Users can view own business" ON businesses
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own business" ON businesses
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Funnel policies
CREATE POLICY "Users can view own funnels" ON funnels
  FOR SELECT USING (business_id::text = auth.uid()::text);

CREATE POLICY "Users can create own funnels" ON funnels
  FOR INSERT WITH CHECK (business_id::text = auth.uid()::text);

CREATE POLICY "Users can update own funnels" ON funnels
  FOR UPDATE USING (business_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own funnels" ON funnels
  FOR DELETE USING (business_id::text = auth.uid()::text);

-- Public can view active funnels for landing pages
CREATE POLICY "Public can view active funnels" ON funnels
  FOR SELECT USING (status = 'active');

-- Click events policies
CREATE POLICY "Public can insert click events" ON click_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own funnel analytics" ON click_events
  FOR SELECT USING (
    funnel_id IN (
      SELECT id FROM funnels WHERE business_id::text = auth.uid()::text
    )
  );

-- Callback requests policies  
CREATE POLICY "Public can create callback requests" ON callback_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own callback requests" ON callback_requests
  FOR SELECT USING (
    funnel_id IN (
      SELECT id FROM funnels WHERE business_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own callback requests" ON callback_requests
  FOR UPDATE USING (
    funnel_id IN (
      SELECT id FROM funnels WHERE business_id::text = auth.uid()::text
    )
  );

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_funnels_updated_at BEFORE UPDATE ON funnels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();