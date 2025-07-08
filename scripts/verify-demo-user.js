const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verifying demo user...')

  try {
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    })

    if (!demoUser) {
      console.error('❌ Demo user not found!')
      return
    }

    console.log('✅ Demo user found:')
    console.log('  - Email:', demoUser.email)
    console.log('  - Email verified:', demoUser.emailVerified)
    console.log('  - Active:', demoUser.isActive)
    console.log('  - Failed login attempts:', demoUser.failedLoginAttempts)
    console.log('  - Locked until:', demoUser.lockedUntil)
    console.log('  - Role:', demoUser.role)

    // Ensure demo user is unlocked and verified
    if (demoUser.lockedUntil || demoUser.failedLoginAttempts > 0 || !demoUser.emailVerified) {
      console.log('\n🔧 Fixing demo user...')
      await prisma.user.update({
        where: { email: 'demo@example.com' },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          emailVerified: true,
          emailVerificationToken: null,
        },
      })
      console.log('✅ Demo user fixed!')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
