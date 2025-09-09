Cleanup Scripts

  1. cleanup-user.js - Clean up business data only

  # Remove all business data but keep user account
  node scripts/cleanup-user.js aussiebengreen@gmail.com

  # Remove everything including user account
  node scripts/cleanup-user.js aussiebengreen@gmail.com --delete-user


  BG: Then sign up again , and then run:  funl-app/scripts/confirm-email.js aussiebengreen@gmail.com

  2. reset-for-testing.js - Complete reset for fresh testing

  # Reset user completely with default password
  node scripts/reset-for-testing.js test@example.com

  # Reset user with custom password
  node scripts/reset-for-testing.js test@example.com mypassword123

  🔍 Status Check Scripts

  3. test-current-state.js - Check current state

  node scripts/test-current-state.js

  Existing scripts:

  - confirm-email.js - Manually confirm user email
  - check-user-status.js - Check user details
  - check-funnels.js - List/check funnels
  - check-business.js - Check business details

  🚀 Rapid Testing Workflow

  1. Clean slate testing:
  node scripts/reset-for-testing.js test@example.com
  2. Data-only cleanup (keep user account):
  node scripts/cleanup-user.js aussiebengreen@gmail.com
  3. Check current state:
  node scripts/test-current-state.js

  The cleanup script removes all related data in the correct order:
  - ✅ Callback requests
  - ✅ Click events
  - ✅ Funnels
  - ✅ Business records
  - ✅ Optionally: User account

  This prevents any foreign key constraint issues and keeps your database clean for
  repeated testing!