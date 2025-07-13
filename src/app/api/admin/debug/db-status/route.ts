import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prisma client not initialized',
          database: {
            connected: false,
          },
        },
        { status: 500 }
      )
    }

    // Check if database connection works
    await prisma.$connect()

    // Check if AdminUser table exists by attempting a simple query
    const adminUserCount = await prisma.adminUser.count()

    // Check if User table exists
    const userCount = await prisma.user.count()

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        adminUserTable: {
          exists: true,
          count: adminUserCount,
        },
        userTable: {
          exists: true,
          count: userCount,
        },
      },
    })
  } catch (error) {
    console.error('Database status check failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        database: {
          connected: false,
        },
      },
      { status: 500 }
    )
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}
