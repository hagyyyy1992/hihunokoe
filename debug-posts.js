const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()

  try {
    console.log('All posts:')
    const allPosts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    })
    console.log(JSON.stringify(allPosts, null, 2))

    console.log('\nSpecific post:')
    const specificPost = await prisma.post.findUnique({
      where: { id: '382daeca-0f61-41cb-8d22-7d1bda2d2828' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    })
    console.log(JSON.stringify(specificPost, null, 2))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
