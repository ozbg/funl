-- Migration: Add onboarding and email confirmation tracking
-- Purpose: Support improved user onboarding flow and email confirmation tracking

-- Add onboarding_completed field to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add email_confirmed_at field to track when user confirmed their email
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries on onboarding status
CREATE INDEX IF NOT EXISTS idx_businesses_onboarding_completed
ON businesses(onboarding_completed)
WHERE onboarding_completed = FALSE;

-- Add index for email confirmation tracking
CREATE INDEX IF NOT EXISTS idx_businesses_email_confirmed
ON businesses(email_confirmed_at)
WHERE email_confirmed_at IS NOT NULL;

-- Update RLS policies to allow users to update their own onboarding status
-- (This allows the onboarding wizard to mark completion)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'businesses'
    AND policyname = 'Users can update their own onboarding status'
  ) THEN
    CREATE POLICY "Users can update their own onboarding status"
    ON businesses
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN businesses.onboarding_completed IS 'Tracks whether the user has completed the initial onboarding wizard';
COMMENT ON COLUMN businesses.email_confirmed_at IS 'Timestamp when the user confirmed their email address';
