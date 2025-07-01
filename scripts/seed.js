const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // デモユーザーの作成
  const hashedPassword = await bcrypt.hash('demo123', 12)

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {
      emailVerified: true, // メール認証済みに設定
    },
    create: {
      userName: 'demo_user',
      email: 'demo@example.com',
      passwordHash: hashedPassword,
      skinType: 'NORMAL',
      emailVerified: true, // メール認証済みに設定
    },
  })

  console.log('✅ Demo user created:', demoUser.email)

  // 管理者ユーザーの作成
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      role: 'SUPER_ADMIN',
      emailVerified: true,
    },
    create: {
      userName: 'admin',
      email: 'admin@example.com',
      passwordHash: hashedPassword, // 同じパスワード (demo123) を使用
      role: 'SUPER_ADMIN',
      emailVerified: true,
    },
  })

  console.log('✅ Admin user created:', adminUser.email)

  // デモ投稿の作成
  const demoPosts = [
    {
      title: '敏感肌でも使えた！優しい化粧水',
      content:
        '敏感肌の私でも安心して使える化粧水を見つけました。刺激もなく、しっとりとした仕上がりで満足しています。',
      productName: 'ナチュラル保湿化粧水',
      productCategory: 'toner',
      skinType: 'SENSITIVE',
      productRating: 5,
      mood: 'love',
    },
    {
      title: 'リピ決定！コスパ最高のクレンジング',
      content:
        'ドラッグストアで買えるプチプラクレンジングですが、メイクもしっかり落ちてつっぱりません。',
      productName: 'やさしいクレンジングオイル',
      productCategory: 'cleansing',
      skinType: 'MIXED',
      mood: 'good',
      usageSituation: {
        season: 'spring',
        timeOfDay: 'evening',
        menstrualCycle: 'normal',
        skinCondition: 'stable',
        weatherCondition: 'normal',
      },
      experienceDetails: {
        fragrance: {
          type: 'citrus',
          intensity: 'weak',
          description: 'ほんのり柑橘系',
        },
        texture: {
          type: 'oil',
          spreadability: 'easy',
          absorption: 'moderate',
          description: 'するっと落ちる',
        },
        afterUse: {
          moisture: 'balanced',
          texture: 'smooth',
          comfort: 'comfortable',
          duration: 'moderate',
          description: 'つっぱらず良い感じ',
        },
      },
    },
  ]

  for (const postData of demoPosts) {
    // 既存の投稿をチェック
    const existingPost = await prisma.post.findFirst({
      where: {
        title: postData.title,
        userId: demoUser.id,
      },
    })

    if (!existingPost) {
      const post = await prisma.post.create({
        data: {
          ...postData,
          userId: demoUser.id,
          publishedAt: new Date(),
        },
      })
      console.log('✅ Demo post created:', post.title)
    } else {
      console.log('⏭️  Demo post already exists:', postData.title)
    }
  }

  console.log('🎉 Seeding completed!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
