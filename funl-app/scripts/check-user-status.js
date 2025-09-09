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
  process.env.SUPABASE_SERVICE_KEY, // Service key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkUserStatus(email) {
  try {
    // Get the user by email
    const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('Error fetching users:', getUserError);
      return;
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      return;
    }

    console.log(`\n📧 User: ${user.email}`);
    console.log(`🆔 User ID: ${user.id}`);
    console.log(`✅ Email confirmed: ${user.email_confirmed_at ? 'YES' : 'NO'}`);
    console.log(`📅 Email confirmed at: ${user.email_confirmed_at || 'Not confirmed'}`);
    console.log(`📅 Created at: ${user.created_at}`);
    console.log(`📅 Updated at: ${user.updated_at}`);
    console.log(`🔐 Provider: ${user.app_metadata?.provider || 'email'}`);
    console.log(`📱 Phone confirmed: ${user.phone_confirmed_at ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/check-user-status.js <email>');
  process.exit(1);
}

console.log(`Checking status for: ${email}`);
checkUserStatus(email);