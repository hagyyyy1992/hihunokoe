import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateAdminUsers() {
  console.log('Starting migration of admin users from User table to AdminUser table...')

  try {
    // Find all users with ADMIN or SUPER_ADMIN role
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN'],
        },
      },
    })

    console.log(`Found ${adminUsers.length} admin users to migrate`)

    for (const user of adminUsers) {
      try {
        // Check if admin user already exists
        const existingAdmin = await prisma.adminUser.findUnique({
          where: { email: user.email },
        })

        if (existingAdmin) {
          console.log(`Admin user already exists: ${user.email}`)
          continue
        }

        // Create admin user
        const adminUser = await prisma.adminUser.create({
          data: {
            adminName: user.userName,
            email: user.email,
            passwordHash: user.passwordHash,
            role: user.role as 'ADMIN' | 'SUPER_ADMIN',
            isActive: user.isActive,
            failedLoginAttempts: user.failedLoginAttempts,
            lockedUntil: user.lockedUntil,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        })

        console.log(`Migrated user: ${user.userName} (${user.email}) -> AdminUser`)

        // Optionally update user role to USER to avoid confusion
        // await prisma.user.update({
        //   where: { id: user.id },
        //   data: { role: 'USER' },
        // })
      } catch (error) {
        console.error(`Error migrating user ${user.email}:`, error)
      }
    }

    console.log('Migration completed!')
  } catch (error) {
    console.error('Migration error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateAdminUsers().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
