const { PrismaClient } = require('@prisma/client')
const bcryptjs = require('bcryptjs')
const { faker } = require('@faker-js/faker/locale/ja')
const cliProgress = require('cli-progress')
const { Command } = require('commander')

const prisma = new PrismaClient({
  log: process.env.DEBUG ? ['query', 'info', 'warn', 'error'] : ['error'],
})

// コマンドライン引数の設定
const program = new Command()
program
  .option('-u, --users <number>', 'Number of users to generate', '1000')
  .option('-p, --posts <number>', 'Number of posts per user', '5')
  .option('-c, --comments <number>', 'Number of comments per post', '3')
  .option('-e, --empathies <number>', 'Number of empathies per post', '10')
  .option('-b, --batch <number>', 'Batch size for bulk operations', '100')
  .option('--clean', 'Clean existing test data before seeding', false)
  .option('--parallel', 'Use parallel processing where possible', false)
  .option('--no-comments', 'Skip comment generation')
  .option('--no-empathies', 'Skip empathy generation')
  .parse(process.argv)

const options = program.opts()

// 設定
const CONFIG = {
  users: parseInt(options.users),
  postsPerUser: parseInt(options.posts),
  commentsPerPost: parseInt(options.comments),
  empathiesPerPost: parseInt(options.empathies),
  batchSize: parseInt(options.batch),
  saltRounds: 10,
  clean: options.clean,
  parallel: options.parallel,
  generateComments: options.comments !== false,
  generateEmpathies: options.empathies !== false,
}

// プログレスバーの設定
const multibar = new cliProgress.MultiBar(
  {
    clearOnComplete: false,
    hideCursor: true,
    format: '{task} |{bar}| {percentage}% | {value}/{total} | ETA: {eta}s',
  },
  cliProgress.Presets.shades_classic
)

// データ定義
const skinTypes = ['normal', 'dry', 'oily', 'combination', 'sensitive']
const genders = ['male', 'female', 'other']
const allergyTypes = [
  'fragrance',
  'alcohol',
  'paraben',
  'sulfate',
  'silicone',
  'mineral_oil',
  'formaldehyde',
  'latex',
  'nickel',
]
const cosmeticCategories = [
  'toner',
  'serum',
  'moisturizer',
  'cleanser',
  'sunscreen',
  'mask',
  'eye_cream',
  'lip_care',
  'foundation',
  'concealer',
]
const moodTags = [
  'refreshing',
  'moisturizing',
  'calming',
  'energizing',
  'luxurious',
  'natural',
  'gentle',
  'powerful',
  'anti-aging',
  'brightening',
]
const empathyTypes = ['like', 'love', 'useful', 'surprised', 'thinking']

// 日本の化粧品ブランド名
const cosmeticBrands = [
  '資生堂',
  'SK-II',
  'コーセー',
  'カネボウ',
  'ソフィーナ',
  'アルビオン',
  'イプサ',
  'エスティローダー',
  'ランコム',
  'クリニーク',
  'MAC',
  'ボビイブラウン',
  'NARS',
  '無印良品',
  'DHC',
  'ファンケル',
  'オルビス',
  'アテニア',
  'ドクターシーラボ',
]

// ヘルパー関数
function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, array.length))
}

function generateUsageSituation() {
  return {
    season: faker.helpers.arrayElement(['spring', 'summer', 'autumn', 'winter']),
    timeOfDay: faker.helpers.arrayElement(['morning', 'afternoon', 'evening', 'night']),
    menstrualCycle: faker.helpers.arrayElement([
      'menstruation',
      'follicular',
      'ovulation',
      'luteal',
      'not_applicable',
    ]),
    skinCondition: faker.helpers.arrayElement([
      'good',
      'normal',
      'bad',
      'sensitive',
      'dry',
      'oily',
    ]),
    weather: faker.helpers.arrayElement([
      'sunny',
      'cloudy',
      'rainy',
      'humid',
      'dry',
      'hot',
      'cold',
    ]),
    occasion: faker.helpers.arrayElement([
      'daily',
      'special',
      'work',
      'date',
      'party',
      'sports',
      'travel',
    ]),
  }
}

function generateExperienceDetails() {
  return {
    scent: faker.helpers.arrayElement([
      'floral',
      'citrus',
      'herbal',
      'woody',
      'fresh',
      'sweet',
      'unscented',
    ]),
    texture: faker.helpers.arrayElement([
      'light',
      'creamy',
      'gel',
      'oil',
      'watery',
      'thick',
      'smooth',
    ]),
    absorption: faker.helpers.arrayElement(['fast', 'moderate', 'slow']),
    finish: faker.helpers.arrayElement(['matte', 'dewy', 'natural', 'glowing', 'satin']),
    stickiness: faker.helpers.arrayElement(['none', 'slight', 'moderate', 'high']),
    moisturizing: faker.number.int({ min: 1, max: 5 }),
    coverage: faker.helpers.arrayElement(['sheer', 'light', 'medium', 'full', 'not_applicable']),
    longevity: faker.helpers.arrayElement(['short', 'moderate', 'long', 'very_long']),
    satisfaction: faker.number.int({ min: 1, max: 5 }),
  }
}

function generateRealisticTitle(cosmeticCategory, brand) {
  const templates = {
    toner: [
      '%sの化粧水で肌が変わった！',
      '%sの化粧水、%d日間使ってみた結果',
      '乾燥肌の私が%sの化粧水を使ったら',
    ],
    serum: [
      '%sの美容液の効果がすごい',
      '%sの新作美容液レビュー',
      '%sの美容液で毛穴が目立たなくなった',
    ],
    moisturizer: [
      '%sの保湿クリーム、コスパ最高',
      '%sのクリームで乾燥知らず',
      '敏感肌でも使える%sの保湿クリーム',
    ],
    cleanser: [
      '%sのクレンジング、メイク落ち抜群',
      '%sの洗顔料で肌トラブル解決',
      '%sのクレンジングオイルが最高',
    ],
    sunscreen: [
      '%sの日焼け止め、白浮きしない！',
      '%sのUVケア、化粧下地にも◎',
      '敏感肌用%sの日焼け止めレビュー',
    ],
  }

  const categoryTemplates = templates[cosmeticCategory] || [
    '%sの新商品レビュー',
    '%sを%dヶ月使った感想',
    '%sの使用感レポート',
  ]
  const template = faker.helpers.arrayElement(categoryTemplates)
  return template.replace('%s', brand).replace('%d', faker.number.int({ min: 1, max: 12 }))
}

function generateRealisticContent(title, cosmeticName, category, details) {
  const intro = faker.helpers.arrayElement([
    `こんにちは！今回は${cosmeticName}についてレビューしていきます。`,
    `最近話題の${cosmeticName}を使ってみました！`,
    `ずっと気になっていた${cosmeticName}をついに購入しました。`,
  ])

  const usage = `使用感は${details.texture}なテクスチャーで、${details.absorption}に肌に馴染みます。
香りは${details.scent}で、${details.finish}な仕上がりになります。`

  const effect = faker.helpers.arrayElement([
    `使い始めて2週間ほどで、肌の調子が良くなってきました。`,
    `朝晩使用していますが、肌がもちもちになった気がします。`,
    `特に乾燥が気になる季節には手放せないアイテムになりました。`,
  ])

  const conclusion = `総合的な満足度は5段階中${details.satisfaction}です。
${details.satisfaction >= 4 ? 'リピート確定です！' : 'もう少し様子を見てみます。'}`

  return `${intro}\n\n${usage}\n\n${effect}\n\n${conclusion}`
}

// バッチ処理の最適化版
async function processBatchOptimized(items, batchSize, processor, progressBar) {
  const results = []
  const totalBatches = Math.ceil(items.length / batchSize)

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)

    if (CONFIG.parallel) {
      // 並列処理
      const batchResults = await Promise.all(batch.map(processor))
      results.push(...batchResults)
    } else {
      // 順次処理（メモリ使用量を抑える）
      for (const item of batch) {
        const result = await processor(item)
        results.push(result)
      }
    }

    if (progressBar) {
      progressBar.update(Math.min(i + batchSize, items.length))
    }
  }

  return results
}

// メイン処理
async function main() {
  console.log('🚀 高度な負荷テスト用データ生成を開始します...')
  console.log('📊 設定:')
  console.log(`  - ユーザー数: ${CONFIG.users}`)
  console.log(`  - 投稿数/ユーザー: ${CONFIG.postsPerUser}`)
  console.log(
    `  - コメント数/投稿: ${CONFIG.generateComments ? CONFIG.commentsPerPost : 'スキップ'}`
  )
  console.log(`  - 共感数/投稿: ${CONFIG.generateEmpathies ? CONFIG.empathiesPerPost : 'スキップ'}`)
  console.log(`  - バッチサイズ: ${CONFIG.batchSize}`)
  console.log(`  - 並列処理: ${CONFIG.parallel ? '有効' : '無効'}`)
  console.log(`  - 予想投稿数: ${CONFIG.users * CONFIG.postsPerUser}`)
  console.log('')

  const startTime = Date.now()

  try {
    // クリーンアップ（オプション）
    if (CONFIG.clean) {
      console.log('🧹 既存のテストデータをクリーンアップ中...')
      const cleanupBar = multibar.create(6, 0, { task: 'クリーンアップ' })

      await prisma.empathy.deleteMany({ where: { user: { email: { contains: '@loadtest' } } } })
      cleanupBar.increment()
      await prisma.comment.deleteMany({ where: { user: { email: { contains: '@loadtest' } } } })
      cleanupBar.increment()
      await prisma.postPermission.deleteMany({
        where: { user: { email: { contains: '@loadtest' } } },
      })
      cleanupBar.increment()
      await prisma.post.deleteMany({ where: { user: { email: { contains: '@loadtest' } } } })
      cleanupBar.increment()
      await prisma.withdrawalSurvey.deleteMany({
        where: { user: { email: { contains: '@loadtest' } } },
      })
      cleanupBar.increment()
      await prisma.user.deleteMany({ where: { email: { contains: '@loadtest' } } })
      cleanupBar.increment()

      cleanupBar.stop()
      console.log('✅ クリーンアップ完了\n')
    }

    // パスワードハッシュの生成
    console.log('🔐 パスワードハッシュを生成中...')
    const passwordHash = await bcryptjs.hash('loadtest123', CONFIG.saltRounds)

    // 1. ユーザー生成
    console.log(`\n👥 ${CONFIG.users}人のユーザーを生成中...`)
    const userBar = multibar.create(CONFIG.users, 0, { task: 'ユーザー作成' })

    const userDataArray = []
    const now = new Date()
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())

    for (let i = 0; i < CONFIG.users; i++) {
      const userNumber = i + 1
      const createdAt = faker.date.between({ from: twoYearsAgo, to: now })

      userDataArray.push({
        userName: `loadtest_user_${userNumber}`,
        email: `loadtest${userNumber}@loadtest.example.com`,
        passwordHash,
        emailVerified: true,
        isActive: true,
        birthDate: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
        gender: faker.helpers.arrayElement(genders),
        skinType: faker.helpers.arrayElement(skinTypes),
        allergies: getRandomItems(allergyTypes, faker.number.int({ min: 0, max: 3 })),
        termsAcceptedAt: createdAt,
        privacyAcceptedAt: createdAt,
        createdAt,
      })
    }

    // createManyを使用して高速化
    await prisma.user.createMany({
      data: userDataArray,
      skipDuplicates: true,
    })
    userBar.update(CONFIG.users)
    userBar.stop()

    // 作成したユーザーを取得
    const users = await prisma.user.findMany({
      where: { email: { contains: '@loadtest' } },
      select: { id: true, createdAt: true, skinType: true },
    })

    // 2. 投稿生成
    const totalPosts = CONFIG.users * CONFIG.postsPerUser
    console.log(`\n📝 ${totalPosts}件の投稿を生成中...`)
    const postBar = multibar.create(totalPosts, 0, { task: '投稿作成' })

    const postDataArray = []
    for (const user of users) {
      for (let j = 0; j < CONFIG.postsPerUser; j++) {
        const brand = faker.helpers.arrayElement(cosmeticBrands)
        const category = faker.helpers.arrayElement(cosmeticCategories)
        const cosmeticName = `${brand} ${faker.commerce.productAdjective()} ${faker.commerce.product()}`
        const details = generateExperienceDetails()
        const title = generateRealisticTitle(category, brand)
        const content = generateRealisticContent(title, cosmeticName, category, details)
        const createdAt = faker.date.between({
          from: user.createdAt,
          to: now,
        })

        postDataArray.push({
          userId: user.id,
          title,
          content,
          cosmeticName,
          cosmeticCategory: category,
          skinType: user.skinType,
          usageSituation: generateUsageSituation(),
          experienceDetails: details,
          moodTag: faker.helpers.arrayElement(moodTags),
          status: 'published',
          viewCount: faker.number.int({ min: 0, max: 5000 }),
          createdAt,
          publishedAt: createdAt,
        })
      }
    }

    // createManyで高速化
    await prisma.post.createMany({
      data: postDataArray,
      skipDuplicates: true,
    })
    postBar.update(totalPosts)
    postBar.stop()

    // 作成した投稿を取得
    const posts = await prisma.post.findMany({
      where: { user: { email: { contains: '@loadtest' } } },
      select: { id: true, userId: true, createdAt: true },
    })

    // 3. コメント生成（オプション）
    if (CONFIG.generateComments) {
      const totalComments = posts.length * CONFIG.commentsPerPost
      console.log(`\n💬 ${totalComments}件のコメントを生成中...`)
      const commentBar = multibar.create(totalComments, 0, { task: 'コメント作成' })

      const commentDataArray = []
      const commentTemplates = [
        '参考になりました！',
        '私も使ってみたいです。',
        '詳しいレビューありがとうございます。',
        'この商品気になってました！',
        '肌質が似ているので参考になります。',
        '次回購入の参考にさせていただきます。',
        '使用感が伝わってきました。',
        'コスパも良さそうですね。',
      ]

      for (const post of posts) {
        const commenters = faker.helpers.arrayElements(users, CONFIG.commentsPerPost)
        for (const commenter of commenters) {
          const baseComment = faker.helpers.arrayElement(commentTemplates)
          const additionalComment = faker.datatype.boolean() ? `\n${faker.lorem.sentence()}` : ''

          commentDataArray.push({
            postId: post.id,
            userId: commenter.id,
            content: baseComment + additionalComment,
            createdAt: faker.date.between({
              from: post.createdAt,
              to: now,
            }),
          })
        }
      }

      // バッチ処理でコメントを作成
      const commentBatches = []
      for (let i = 0; i < commentDataArray.length; i += CONFIG.batchSize * 10) {
        commentBatches.push(commentDataArray.slice(i, i + CONFIG.batchSize * 10))
      }

      for (const batch of commentBatches) {
        await prisma.comment.createMany({
          data: batch,
          skipDuplicates: true,
        })
        commentBar.increment(batch.length)
      }

      commentBar.stop()
    }

    // 4. 共感生成（オプション）
    if (CONFIG.generateEmpathies) {
      const totalEmpathies = posts.length * CONFIG.empathiesPerPost
      console.log(`\n❤️  ${totalEmpathies}件の共感を生成中...`)
      const empathyBar = multibar.create(totalEmpathies, 0, { task: '共感作成' })

      const empathyDataArray = []

      for (const post of posts) {
        const empathizers = faker.helpers.arrayElements(
          users.filter(u => u.id !== post.userId),
          Math.min(CONFIG.empathiesPerPost, users.length - 1)
        )

        for (const empathizer of empathizers) {
          empathyDataArray.push({
            postId: post.id,
            userId: empathizer.id,
            empathyType: faker.helpers.arrayElement(empathyTypes),
            createdAt: faker.date.between({
              from: post.createdAt,
              to: now,
            }),
          })
        }
      }

      // バッチ処理で共感を作成
      const empathyBatches = []
      for (let i = 0; i < empathyDataArray.length; i += CONFIG.batchSize * 20) {
        empathyBatches.push(empathyDataArray.slice(i, i + CONFIG.batchSize * 20))
      }

      for (const batch of empathyBatches) {
        await prisma.empathy.createMany({
          data: batch,
          skipDuplicates: true,
        })
        empathyBar.increment(batch.length)
      }

      empathyBar.stop()

      // 5. 共感数の更新
      console.log('\n📊 投稿の共感数を更新中...')
      const updateBar = multibar.create(posts.length, 0, { task: '共感数更新' })

      // バッチで共感数を取得して更新
      const postIds = posts.map(p => p.id)
      const empathyCounts = await prisma.empathy.groupBy({
        by: ['postId'],
        where: { postId: { in: postIds } },
        _count: { postId: true },
      })

      const empathyCountMap = new Map(empathyCounts.map(ec => [ec.postId, ec._count.postId]))

      // updateManyを使用してバッチ更新
      for (const [postId, count] of empathyCountMap) {
        await prisma.post.update({
          where: { id: postId },
          data: { empathyCount: count },
        })
        updateBar.increment()
      }

      updateBar.stop()
    }

    multibar.stop()

    // 統計情報の取得
    const stats = await prisma.$transaction([
      prisma.user.count({ where: { email: { contains: '@loadtest' } } }),
      prisma.post.count({ where: { user: { email: { contains: '@loadtest' } } } }),
      prisma.comment.count({ where: { user: { email: { contains: '@loadtest' } } } }),
      prisma.empathy.count({ where: { user: { email: { contains: '@loadtest' } } } }),
    ])

    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000

    console.log('\n✅ 負荷テスト用データの生成が完了しました！')
    console.log('\n📈 生成結果:')
    console.log(`  - ユーザー: ${stats[0]}人`)
    console.log(`  - 投稿: ${stats[1]}件`)
    console.log(`  - コメント: ${stats[2]}件`)
    console.log(`  - 共感: ${stats[3]}件`)
    console.log(`  - 実行時間: ${duration.toFixed(2)}秒`)
    console.log(`  - 平均処理速度:`)
    console.log(`    - ユーザー: ${(stats[0] / duration).toFixed(2)}人/秒`)
    console.log(`    - 投稿: ${(stats[1] / duration).toFixed(2)}件/秒`)
    console.log(
      `    - 全体: ${((stats[0] + stats[1] + stats[2] + stats[3]) / duration).toFixed(2)}レコード/秒`
    )
  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error)
    multibar.stop()
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// エラーハンドリング
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  処理を中断しています...')
  multibar.stop()
  await prisma.$disconnect()
  process.exit(0)
})

// 実行
main()
