#!/usr/bin/env node

// Script to migrate existing admin users from User table to AdminUser table
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateAdminUsers() {
  console.log('🚀 Starting admin user migration...')

  try {
    // First, check if there are any users with admin roles
    const adminUsers = await prisma.$queryRaw`
      SELECT id, user_name, email, password_hash, role, is_active, failed_login_attempts, locked_until, created_at, updated_at
      FROM users
      WHERE role IN ('admin', 'super_admin')
    `

    if (adminUsers && adminUsers.length > 0) {
      console.log(`Found ${adminUsers.length} admin users to migrate`)

      // Create admin users
      for (const user of adminUsers) {
        try {
          await prisma.$executeRaw`
            INSERT INTO admin_users (id, admin_name, email, password_hash, role, is_active, failed_login_attempts, locked_until, created_at, updated_at)
            VALUES (${user.id}, ${user.user_name}, ${user.email}, ${user.password_hash}, ${user.role}::admin_roles, ${user.is_active}, ${user.failed_login_attempts}, ${user.locked_until}, ${user.created_at}, ${user.updated_at})
          `
          console.log(`✅ Migrated admin user: ${user.user_name}`)
        } catch (error) {
          console.error(`❌ Failed to migrate user ${user.user_name}:`, error.message)
        }
      }

      // Update admin_logs to reference the new admin users
      await prisma.$executeRaw`
        UPDATE admin_logs
        SET admin_user_id = users.id
        FROM users
        WHERE admin_logs.admin_user_id = users.id
        AND users.role IN ('admin', 'super_admin')
      `

      console.log('✅ Updated admin_logs references')
    } else {
      console.log('No admin users found to migrate')
    }

    console.log('✅ Admin user migration completed!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateAdminUsers().catch(error => {
  console.error('Migration error:', error)
  process.exit(1)
})
