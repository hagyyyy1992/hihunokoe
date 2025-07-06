#!/usr/bin/env node

// Script to fix Supabase migration history
// This marks failed migrations as resolved when tables already exist

const { execSync } = require('child_process')

async function fixMigrations() {
  console.log('🔧 Fixing Supabase migration history...')

  const DATABASE_URL = process.env.DATABASE_URL

  if (!DATABASE_URL || !DATABASE_URL.includes('supabase')) {
    console.log('⚠️  This script should only be run for Supabase databases')
    console.log('    Current DATABASE_URL:', DATABASE_URL ? 'Set but not Supabase' : 'Not set')
    return
  }

  try {
    // First, check current migration status
    console.log('\n📋 Current migration status:')
    try {
      execSync('npx prisma migrate status', { stdio: 'inherit' })
    } catch (e) {
      console.log(
        '⚠️  Migration status check failed (this is expected if migrations are out of sync)'
      )
    }

    console.log('\n🔍 Checking if tables already exist in the database...')

    // Create a SQL script to manually mark the migration as applied
    const markMigrationSQL = `
-- Check if _prisma_migrations table exists
DO $$ 
BEGIN
  -- Create _prisma_migrations table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = '_prisma_migrations') THEN
    CREATE TABLE "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    );
  END IF;

  -- Check if the initial migration exists
  IF NOT EXISTS (
    SELECT 1 FROM _prisma_migrations 
    WHERE migration_name = '20250622144403_init'
  ) THEN
    -- Check if users table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
      -- Mark the initial migration as applied since tables already exist
      INSERT INTO _prisma_migrations (
        id,
        checksum,
        finished_at,
        migration_name,
        logs,
        rolled_back_at,
        started_at,
        applied_steps_count
      ) VALUES (
        gen_random_uuid()::text,
        '8c9f6e4d3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e',
        NOW(),
        '20250622144403_init',
        NULL,
        NULL,
        NOW(),
        1
      );
      
      RAISE NOTICE 'Initial migration marked as applied';
    ELSE
      RAISE NOTICE 'Users table does not exist - migration needs to be applied normally';
    END IF;
  ELSE
    RAISE NOTICE 'Initial migration already exists in history';
  END IF;
END $$;
    `

    // Save SQL to a temporary file
    const fs = require('fs')
    const path = require('path')
    const tmpFile = path.join(__dirname, 'fix-migration.sql')

    fs.writeFileSync(tmpFile, markMigrationSQL)

    console.log('\n📝 Executing migration fix SQL...')
    console.log('   This will mark the initial migration as already applied')

    // Execute the SQL using prisma db execute
    try {
      execSync(`npx prisma db execute --file ${tmpFile}`, { stdio: 'inherit' })
      console.log('✅ Migration history fixed!')
    } catch (error) {
      console.error('❌ Failed to execute SQL:', error.message)
      throw error
    } finally {
      // Clean up temp file
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile)
      }
    }

    // Now try to deploy remaining migrations
    console.log('\n🚀 Deploying remaining migrations...')
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' })
      console.log('✅ All migrations deployed successfully!')
    } catch (error) {
      console.log('⚠️  Migration deployment failed. You may need to manually resolve conflicts.')
      console.log('   Check the Supabase dashboard to verify table structure.')
    }
  } catch (error) {
    console.error('❌ Error fixing migrations:', error.message)
    process.exit(1)
  }
}

// Run the fix
fixMigrations().catch(console.error)
