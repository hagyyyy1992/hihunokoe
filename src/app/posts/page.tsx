import { Suspense } from 'react'
import { getClient } from '@/lib/apollo-server-client'
import { GET_POSTS } from '@/graphql/queries/post'
import PostsClient from './PostsClient'

interface PostNode {
  id: string
  title: string
  content: string
  cosmeticName: string
  cosmeticCategory?: string
  skinType?: string
  moodTag?: string
  viewCount: number
  empathyCount: number
  commentCount: number
  createdAt: string
  user: {
    id: string
    displayName: string
    profileImageUrl?: string
  }
}

interface PostData {
  posts: {
    edges: Array<{
      cursor: string
      node: PostNode
    }>
    pageInfo: {
      hasNextPage: boolean
      endCursor?: string
    }
    totalCount: number
  }
}

async function PostsPage() {
  let initialData: PostData | undefined

  try {
    // サーバーサイドで初期データを取得（より多くのデータを取得）
    const { data } = await getClient().query<PostData>({
      query: GET_POSTS,
      variables: {
        first: 50, // クライアントサイドフィルタリング用により多くのデータを取得
        filter: {},
        orderBy: 'CREATED_AT_DESC',
      },
      errorPolicy: 'all',
    })
    initialData = data

    // バックグラウンドでよく使われるフィルターをプリロード（ノンブロッキング）
    if (typeof window === 'undefined') {
      // サーバーサイドでのみ実行
      import('@api/interface-adapters/repositories/Post.repository')
        .then(({ PostRepository }) => {
          const repository = new PostRepository()
          repository.preloadPopularFilters().catch(console.error)
        })
        .catch(console.error)
    }
  } catch (error) {
    // エラーの場合はクライアントサイドでフェッチするためundefinedのまま
    console.error('Failed to fetch initial posts data:', error)
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
            <div className="grid gap-6 mb-8">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 animate-pulse"
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1">
                      <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="flex gap-2">
                        <div className="h-4 bg-gray-200 rounded-full w-16"></div>
                        <div className="h-4 bg-gray-200 rounded-full w-20"></div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3 sm:mb-4">
                    <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <PostsClient initialData={initialData} />
    </Suspense>
  )
}

export default PostsPage
