import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function seedAdminUsers() {
  console.log('Creating admin users...')

  try {
    const adminUsers = [
      {
        adminName: 'superadmin',
        email: 'super@admin.com',
        password: 'SuperAdmin123!',
        role: 'SUPER_ADMIN' as const,
      },
      {
        adminName: 'admin1',
        email: 'admin1@admin.com',
        password: 'Admin123!',
        role: 'ADMIN' as const,
      },
      {
        adminName: 'admin2',
        email: 'admin2@admin.com',
        password: 'Admin123!',
        role: 'ADMIN' as const,
      },
    ]

    for (const adminData of adminUsers) {
      const passwordHash = await bcrypt.hash(adminData.password, 10)

      const adminUser = await prisma.adminUser.upsert({
        where: { email: adminData.email },
        update: {
          adminName: adminData.adminName,
          passwordHash,
          role: adminData.role,
          isActive: true,
        },
        create: {
          adminName: adminData.adminName,
          email: adminData.email,
          passwordHash,
          role: adminData.role,
          isActive: true,
        },
      })

      console.log(`Created/Updated admin user: ${adminUser.adminName} (${adminUser.email})`)
    }

    console.log('Admin users created successfully!')
  } catch (error) {
    console.error('Error creating admin users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedAdminUsers().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
