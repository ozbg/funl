#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing current state of aussiebengreen@gmail.com...\n');

// Test current user status
console.log('1. Checking user status...');
const { exec } = require('child_process');

exec('node scripts/check-user-status.js aussiebengreen@gmail.com', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error checking user:', error);
    return;
  }
  console.log(stdout);
  
  console.log('\n2. Checking funnels...');
  exec('node scripts/check-funnels.js', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error checking funnels:', error);
      return;
    }
    console.log(stdout);
    
    console.log('\n3. Checking business...');
    exec('node scripts/check-business.js 97b70d92-8d1b-4a6d-b4c9-ce7b8a8c7425', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error checking business:', error);
        return;
      }
      console.log(stdout);
      
      console.log('\n✨ Current state check complete!');
    });
  });
});