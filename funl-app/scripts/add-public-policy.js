#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function addPublicPolicy() {
  try {
    console.log('Adding public policy for businesses with active funnels...');
    
    const { error } = await supabase.rpc('exec', {
      sql: `
        CREATE POLICY "Public can view business info for active funnels" ON businesses
          FOR SELECT USING (
            id IN (
              SELECT DISTINCT business_id 
              FROM funnels 
              WHERE status = 'active'
            )
          );
      `
    });

    if (error) {
      console.error('Error creating policy:', error);
      return;
    }

    console.log('✅ Successfully added public policy for businesses');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addPublicPolicy();