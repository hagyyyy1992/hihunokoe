import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const post = await prisma.post.findUnique({
      where: {
        id,
        status: 'published',
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            displayName: true,
            skinType: true,
            profileImageUrl: true,
          },
        },
        empathies: {
          include: {
            user: {
              select: {
                id: true,
                userName: true,
                displayName: true,
              },
            },
          },
        },
        comments: {
          where: {
            isActive: true,
            parentCommentId: null, // トップレベルコメントのみ
          },
          include: {
            user: {
              select: {
                id: true,
                userName: true,
                displayName: true,
                skinType: true,
              },
            },
            replies: {
              where: {
                isActive: true,
              },
              include: {
                user: {
                  select: {
                    id: true,
                    userName: true,
                    displayName: true,
                    skinType: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            empathies: true,
            comments: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      )
    }

    // 閲覧数を増加
    await prisma.post.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Post fetch error:', error)
    return NextResponse.json(
      { error: '投稿の取得に失敗しました' },
      { status: 500 }
    )
  }
}