const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDemoUser() {
  try {
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    })

    if (demoUser) {
      console.log('📊 Demo user found:')
      console.log('  ID:', demoUser.id)
      console.log('  Username:', demoUser.userName)
      console.log('  Email:', demoUser.email)
      console.log('  Email Verified:', demoUser.emailVerified)
      console.log('  Is Active:', demoUser.isActive)
      console.log('  Created At:', demoUser.createdAt)
      
      // パスワードハッシュの確認（セキュリティのため最初の10文字のみ）
      console.log('  Password Hash (first 10 chars):', demoUser.passwordHash.substring(0, 10) + '...')
    } else {
      console.log('❌ Demo user not found!')
    }

    // 全ユーザー数も確認
    const totalUsers = await prisma.user.count()
    console.log(`\n📈 Total users in database: ${totalUsers}`)

    // メール認証済みユーザー数
    const verifiedUsers = await prisma.user.count({
      where: { emailVerified: true }
    })
    console.log(`✅ Verified users: ${verifiedUsers}`)

  } catch (error) {
    console.error('❌ Error checking demo user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDemoUser()