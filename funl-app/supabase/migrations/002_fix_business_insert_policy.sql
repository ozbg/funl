-- Fix: Add INSERT policy for businesses table
-- Users need to be able to create their business record during signup

CREATE POLICY "Users can create own business" ON businesses
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);