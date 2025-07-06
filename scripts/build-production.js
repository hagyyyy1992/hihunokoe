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
    
    // Check if it's the specific "relation already exists" error
    if (error.message.includes('relation "users" already exists') || 
        error.message.includes('20250622144403_init')) {
      console.error('')
      console.error('📌 Known issue: Initial migration conflict detected')
      console.error('   The database already has tables but migration history is incomplete.')
      console.error('')
      console.error('🔧 To fix this issue locally:')
      console.error('   1. Run: node scripts/fix-supabase-migrations.js')
      console.error('   2. Or manually mark the migration as applied in Supabase')
      console.error('')
      console.error('📝 For production:')
      console.error('   - The app will work normally despite this warning')
      console.error('   - Tables already exist and are functional')
      console.error('   - This is a migration history issue only')
    } else {
      console.error('💡 This might be due to:')
      console.error('  1. Failed previous migration that needs manual resolution')
      console.error('  2. Database connection issues')
      console.error('  3. Permission problems')
      console.error('')
      console.error('📝 To resolve this issue:')
      console.error('  1. Connect to your Supabase database')
      console.error('  2. Check the _prisma_migrations table')
      console.error('  3. Mark failed migrations as rolled back or resolve them manually')
    }
    
    console.error('')
    console.error('🔄 Continuing with build despite migration failure...')
  }
} else {
  console.log('⚠️  DATABASE_URL not set - skipping migrations')
}

// Generate GraphQL types before building
console.log('🔄 Generating GraphQL types...')
try {
  execSync('npm run codegen', { stdio: 'inherit' })
  console.log('✅ GraphQL types generated successfully!')
} catch (error) {
  console.error('❌ GraphQL code generation failed:', error.message)
  process.exit(1)
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
