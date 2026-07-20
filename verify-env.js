#!/usr/bin/env node

// Quick verification script for required environment variables
const fs = require('fs');
const path = require('path');

console.log('\n=== Caviti.io Admin Dashboard - Environment Verification ===\n');

const envPath = path.join(__dirname, '.env.local');
const envExists = fs.existsSync(envPath);

console.log(`✓ .env.local file: ${envExists ? 'EXISTS' : 'MISSING ❌'}`);

if (envExists) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'ADMIN_EMAILS',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  console.log('\nRequired environment variables:');
  requiredVars.forEach((varName) => {
    const found = lines.some(line => line.startsWith(`${varName}=`));
    const status = found ? '✓' : '❌';
    const value = lines
      .find(line => line.startsWith(`${varName}=`))
      ?.split('=')[1]
      ?.substring(0, 20);
    console.log(`  ${status} ${varName}${value ? ` = ${value}...` : ' (empty)'}`);
  });
  
  // Check service role key specifically
  const serviceRoleKeyLine = lines.find(line => line.startsWith('SUPABASE_SERVICE_ROLE_KEY='));
  if (!serviceRoleKeyLine || serviceRoleKeyLine.includes('=undefined') || serviceRoleKeyLine.split('=')[1]?.trim() === '') {
    console.log('\n🚨 CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing or empty!');
    console.log('\nFix: Get the key from Supabase Dashboard:');
    console.log('  1. Go to your project settings');
    console.log('  2. Click "API" in the sidebar');
    console.log('  3. Find "Service Role" section (not "Anon Key")');
    console.log('  4. Copy the full key');
    console.log('  5. Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
    console.log('  6. Restart dev server: npm run dev\n');
  }
} else {
  console.log('\n🚨 CRITICAL: .env.local file not found!');
  console.log('\nCreate .env.local in project root with:');
  console.log(`
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
ADMIN_EMAILS=your-email@example.com
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
  `);
}

console.log('=== Verification Complete ===\n');
