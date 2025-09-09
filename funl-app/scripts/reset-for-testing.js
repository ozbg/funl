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

async function resetUserForTesting(email, password = 'test123!') {
  try {
    console.log(`🔄 Resetting user ${email} for fresh onboarding testing...\n`);
    
    // Step 1: Cleanup existing data
    console.log('Step 1: Cleaning up existing data...');
    await cleanupUserData(email, true); // Delete user and all data
    
    console.log('\n⏳ Waiting 2 seconds for cleanup to complete...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Create fresh user
    console.log('Step 2: Creating fresh user account...');
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Auto-confirm email for testing
    });

    if (createError) {
      console.error('❌ Error creating user:', createError);
      return;
    }

    console.log(`✅ Created user: ${authData.user.email} (${authData.user.id})`);
    
    console.log(`\n🎉 User ${email} is now ready for fresh onboarding!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`✅ Email pre-confirmed: Yes`);
    console.log(`\n💡 You can now test the complete onboarding flow from scratch.`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Copy cleanup function from cleanup-user.js
async function cleanupUserData(email, deleteUser = false) {
  try {
    // Find the user
    const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('❌ Error fetching users:', getUserError);
      return;
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.log(`⚠️  User with email ${email} not found - nothing to clean up`);
      return;
    }

    console.log(`👤 Found existing user: ${user.id}`);
    
    // Find business associated with this user
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', user.id)
      .single();

    if (business) {
      console.log(`🏢 Found business: ${business.name} - deleting all associated data...`);
      
      // Delete all funnels and associated data
      const { data: funnels } = await supabase
        .from('funnels')
        .select('id, name')
        .eq('business_id', business.id);

      if (funnels && funnels.length > 0) {
        for (const funnel of funnels) {
          // Delete callback requests and click events (cascading will handle this)
          await supabase.from('callback_requests').delete().eq('funnel_id', funnel.id);
          await supabase.from('click_events').delete().eq('funnel_id', funnel.id);
        }
        
        // Delete all funnels
        await supabase.from('funnels').delete().eq('business_id', business.id);
        console.log(`✅ Deleted ${funnels.length} funnel(s) and associated data`);
      }
      
      // Delete business
      await supabase.from('businesses').delete().eq('id', business.id);
      console.log(`✅ Deleted business: ${business.name}`);
    }
    
    // Delete the user account
    if (deleteUser) {
      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteUserError) {
        console.error('❌ Error deleting user:', deleteUserError);
      } else {
        console.log(`✅ Deleted user account: ${email}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in cleanup:', error);
  }
}

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3] || 'test123!';

if (!email) {
  console.error(`
Usage: node scripts/reset-for-testing.js <email> [password]

Default password: test123!

Examples:
  node scripts/reset-for-testing.js test@example.com
  node scripts/reset-for-testing.js test@example.com mypassword123
  `);
  process.exit(1);
}

resetUserForTesting(email, password);