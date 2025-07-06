#!/usr/bin/env node

// Production build script for Vercel deployment
// This script handles database migrations with proper error handling

const { execSync } = require('child_process')

console.log('🚀 Starting production build...')

// Always generate Prisma Client first
console.log('📦 Generating Prisma Client...')
try {
  execSync('prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma Client generated successfully')
} catch (error) {
  console.error('❌ Prisma Client generation failed:', error.message)
  process.exit(1)
}

// Try to run migrations, but don't fail the build if they fail
if (process.env.DATABASE_URL) {
  try {
    console.log('🗄️  Attempting to deploy database migrations...')
    execSync('prisma migrate deploy', { stdio: 'inherit' })
    console.log('✅ Migrations deployed successfully!')
  } catch (error) {
    console.error('⚠️  Migration deployment failed:', error.message)
    console.error('💡 This might be due to:')
    console.error('  1. Failed previous migration that needs manual resolution')
    console.error('  2. Database connection issues')
    console.error('  3. Permission problems')
    console.error('')
    console.error('📝 To resolve this issue:')
    console.error('  1. Connect to your Supabase database')
    console.error('  2. Check the _prisma_migrations table')
    console.error('  3. Mark failed migrations as rolled back or resolve them manually')
    console.error('')
    console.error('🔄 Continuing with build despite migration failure...')
  }
} else {
  console.log('⚠️  DATABASE_URL not set - skipping migrations')
}

// Run Next.js build
console.log('🏗️  Building Next.js application...')
try {
  execSync('next build', { stdio: 'inherit' })
  console.log('✅ Next.js build completed successfully!')
} catch (error) {
  console.error('❌ Next.js build failed:', error.message)
  process.exit(1)
}

console.log('🏁 Build completed!')
