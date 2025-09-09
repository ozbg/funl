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

async function cleanupUserData(email, deleteUser = false) {
  try {
    console.log(`🧹 Starting cleanup for user: ${email}`);
    
    // 1. Find the user
    const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('❌ Error fetching users:', getUserError);
      return;
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.log(`⚠️  User with email ${email} not found`);
      return;
    }

    console.log(`👤 Found user: ${user.id}`);
    
    // 2. Find business associated with this user
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', user.id)
      .single();

    if (businessError && businessError.code !== 'PGRST116') {
      console.error('❌ Error fetching business:', businessError);
      return;
    }

    if (business) {
      console.log(`🏢 Found business: ${business.name} (ID: ${business.id})`);
      
      // 3. Delete all funnels and associated data for this business
      const { data: funnels } = await supabase
        .from('funnels')
        .select('id, name')
        .eq('business_id', business.id);

      if (funnels && funnels.length > 0) {
        console.log(`📊 Found ${funnels.length} funnel(s) to clean up:`);
        
        for (const funnel of funnels) {
          console.log(`  • ${funnel.name} (${funnel.id})`);
          
          // Delete callback requests
          const { error: callbackError } = await supabase
            .from('callback_requests')
            .delete()
            .eq('funnel_id', funnel.id);
          
          if (callbackError) {
            console.warn(`    ⚠️  Error deleting callback requests: ${callbackError.message}`);
          } else {
            console.log(`    ✅ Deleted callback requests`);
          }
          
          // Delete click events
          const { error: eventsError } = await supabase
            .from('click_events')
            .delete()
            .eq('funnel_id', funnel.id);
          
          if (eventsError) {
            console.warn(`    ⚠️  Error deleting click events: ${eventsError.message}`);
          } else {
            console.log(`    ✅ Deleted click events`);
          }
        }
        
        // Delete all funnels
        const { error: funnelsError } = await supabase
          .from('funnels')
          .delete()
          .eq('business_id', business.id);
        
        if (funnelsError) {
          console.error('❌ Error deleting funnels:', funnelsError);
          return;
        } else {
          console.log(`✅ Deleted ${funnels.length} funnel(s)`);
        }
      }
      
      // 4. Delete business
      const { error: deleteBusinessError } = await supabase
        .from('businesses')
        .delete()
        .eq('id', business.id);
      
      if (deleteBusinessError) {
        console.error('❌ Error deleting business:', deleteBusinessError);
        return;
      } else {
        console.log(`✅ Deleted business: ${business.name}`);
      }
    } else {
      console.log(`⚠️  No business found for user ${email}`);
    }
    
    // 5. Optionally delete the user account entirely
    if (deleteUser) {
      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteUserError) {
        console.error('❌ Error deleting user:', deleteUserError);
        return;
      } else {
        console.log(`✅ Deleted user account: ${email}`);
      }
    } else {
      console.log(`⚠️  User account preserved. To delete user account, use --delete-user flag`);
    }
    
    console.log(`\n🎉 Cleanup completed for ${email}`);
    
    if (!deleteUser) {
      console.log(`\n💡 User can now go through onboarding process again with the same email`);
      console.log(`   The user account still exists but all business data has been removed`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Get email and flags from command line arguments
const args = process.argv.slice(2);
const email = args.find(arg => !arg.startsWith('--'));
const deleteUser = args.includes('--delete-user');

if (!email) {
  console.error(`
Usage: node scripts/cleanup-user.js <email> [--delete-user]

Options:
  --delete-user    Also delete the user account (default: keep user account)

Examples:
  node scripts/cleanup-user.js user@example.com
  node scripts/cleanup-user.js user@example.com --delete-user
  `);
  process.exit(1);
}

console.log(`🔥 Cleanup mode: ${deleteUser ? 'DELETE USER + DATA' : 'DELETE DATA ONLY'}`);
cleanupUserData(email, deleteUser);