-- Add policy to allow public access to business data for active funnels
CREATE POLICY "Public can view business info for active funnels" ON businesses
  FOR SELECT USING (
    id IN (
      SELECT DISTINCT business_id 
      FROM funnels 
      WHERE status = 'active'
    )
  );