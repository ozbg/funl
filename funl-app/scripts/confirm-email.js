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

async function confirmUserEmail(email) {
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

    if (user.email_confirmed_at) {
      console.log(`User ${email} is already confirmed at ${user.email_confirmed_at}`);
      return;
    }

    // Update user to confirm email
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true
    });

    if (error) {
      console.error('Error confirming email:', error);
      return;
    }

    console.log(`✅ Successfully confirmed email for user: ${email}`);
    console.log(`User ID: ${user.id}`);
    console.log(`User data:`, JSON.stringify(data.user, null, 2));
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/confirm-email.js <email>');
  process.exit(1);
}

console.log(`Confirming email for: ${email}`);
confirmUserEmail(email);