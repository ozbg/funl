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

async function checkFunnels(shortUrl) {
  try {
    if (shortUrl) {
      // Check specific funnel
      const { data: funnel, error } = await supabase
        .from('funnels')
        .select('*')
        .eq('short_url', shortUrl)
        .single()

      if (error || !funnel) {
        console.log(`❌ Funnel with short_url '${shortUrl}' not found`);
        return;
      }

      console.log(`\n📋 Funnel: ${funnel.name}`);
      console.log(`🆔 ID: ${funnel.id}`);
      console.log(`🔗 Short URL: ${funnel.short_url}`);
      console.log(`📊 Status: ${funnel.status}`);
      console.log(`📅 Created: ${new Date(funnel.created_at).toLocaleString()}`);
      console.log(`👤 Business ID: ${funnel.business_id}`);
    } else {
      // List all funnels
      const { data: funnels, error } = await supabase
        .from('funnels')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching funnels:', error);
        return;
      }

      if (funnels.length === 0) {
        console.log('No funnels found');
        return;
      }

      console.log(`\n📋 Found ${funnels.length} funnel(s):\n`);
      funnels.forEach((funnel, index) => {
        console.log(`${index + 1}. ${funnel.name}`);
        console.log(`   🔗 ${funnel.short_url}`);
        console.log(`   📊 Status: ${funnel.status}`);
        console.log(`   📅 ${new Date(funnel.created_at).toLocaleString()}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Get shortUrl from command line arguments
const shortUrl = process.argv[2];

console.log(shortUrl ? `Checking funnel: ${shortUrl}` : 'Listing all funnels...');
checkFunnels(shortUrl);