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

async function checkBusiness(businessId) {
  try {
    const { data: business, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single()

    if (error || !business) {
      console.log(`❌ Business with ID '${businessId}' not found`);
      console.log('Error:', error);
      return;
    }

    console.log(`\n🏢 Business: ${business.name}`);
    console.log(`🆔 ID: ${business.id}`);
    console.log(`📧 Email: ${business.email}`);
    console.log(`📞 Phone: ${business.phone || 'Not set'}`);
    console.log(`🌐 Website: ${business.website || 'Not set'}`);
    console.log(`📅 Created: ${new Date(business.created_at).toLocaleString()}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Get businessId from command line arguments
const businessId = process.argv[2];

if (!businessId) {
  console.error('Usage: node scripts/check-business.js <business_id>');
  process.exit(1);
}

console.log(`Checking business: ${businessId}`);
checkBusiness(businessId);