#!/usr/bin/env node

/**
 * Admin Setup Verification Script
 * Run: node verify-admin-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n=== CAVITI ADMIN DASHBOARD SETUP VERIFICATION ===\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found');
  console.log('📝 Creating .env.local template...\n');
  process.exit(1);
}

// Read .env.local
const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

// Parse env variables
const env = {};
lines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  env[key.trim()] = valueParts.join('=').trim();
});

console.log('📋 Checking Environment Variables:\n');

// Check NEXT_PUBLIC_SUPABASE_URL
if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url_here') {
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL is set');
} else {
  console.log('⚠️  NEXT_PUBLIC_SUPABASE_URL needs to be set');
}

// Check NEXT_PUBLIC_SUPABASE_ANON_KEY
if (env.NEXT_PUBLIC_SUPABASE_ANON_KEY && env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here') {
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set');
} else {
  console.log('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY needs to be set');
}

// Check ADMIN_EMAILS
if (env.ADMIN_EMAILS && env.ADMIN_EMAILS !== 'your-admin-email@example.com') {
  console.log(`✅ ADMIN_EMAILS is set to: ${env.ADMIN_EMAILS}`);
} else {
  console.log('❌ ADMIN_EMAILS is not set - REQUIRED FOR ADMIN DASHBOARD');
  console.log('   Add your email to .env.local: ADMIN_EMAILS=your-email@example.com');
}

// Check SUPABASE_SERVICE_ROLE_KEY
if (env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key_here') {
  console.log(`✅ SUPABASE_SERVICE_ROLE_KEY is set (${env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...)`);
} else {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY is not set - REQUIRED FOR ADMIN DASHBOARD');
  console.log('   Get it from: Supabase Dashboard → Settings → API → Service Role Key');
}

console.log('\n=== NEXT STEPS ===\n');

const needsSetup = 
  !env.ADMIN_EMAILS || env.ADMIN_EMAILS === 'your-admin-email@example.com' ||
  !env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY === 'your_service_role_key_here';

if (needsSetup) {
  console.log('1. Edit .env.local in your project root');
  console.log('2. Set ADMIN_EMAILS to your email address');
  console.log('3. Get Service Role Key from Supabase Dashboard');
  console.log('4. Set SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.log('5. Restart the dev server (npm run dev)');
  console.log('\n📖 See ADMIN_SETUP_VERIFICATION.md for detailed instructions\n');
} else {
  console.log('✅ All required environment variables are set!');
  console.log('\nRestart your dev server and try the admin dashboard:\n');
  console.log('1. npm run dev');
  console.log('2. Go to http://localhost:3000/admin/dashboard');
  console.log('3. Click on Users');
  console.log('4. Click View on any user\n');
}
