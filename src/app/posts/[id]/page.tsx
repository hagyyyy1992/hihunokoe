import { getClient } from '@/lib/apollo-server-client'
import { GET_POST } from '@/graphql/queries/post'
import PostDetailClient from './PostDetailClient'

interface PostNode {
  id: string
  title: string
  content: string
  cosmeticName: string
  cosmeticCategory?: string
  skinType?: string
  usageSituation?: {
    season?: string
    timeOfDay?: string
    menstrualCycle?: string
    skinCondition?: string
    weatherCondition?: string
  }
  experienceDetails?: {
    fragrance?: {
      type?: string
      intensity?: string
      description?: string
    }
    texture?: {
      type?: string
      spreadability?: string
      absorption?: string
      description?: string
    }
    afterUse?: {
      moisture?: string
      texture?: string
      comfort?: string
      duration?: string
      description?: string
    }
  }
  moodTag?: string
  createdAt: string
  viewCount: number
  empathyCount: number
  commentCount: number
  user: {
    id: string
    displayName: string
    profileImageUrl?: string
    bio?: string
  }
}

interface PostData {
  post: PostNode
}

async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let initialData: PostData | undefined

  try {
    // サーバーサイドで投稿データを事前取得（empathies/commentsの配列は除外済み）
    const { data, error: graphqlError } = await getClient().query<PostData>({
      query: GET_POST,
      variables: { id },
      errorPolicy: 'all',
    })

    if (data?.post) {
      initialData = data

      // バックグラウンドでキャッシュ戦略のプリロード（ノンブロッキング）
      if (typeof window === 'undefined' && data?.post) {
        // サーバーサイドでのみ実行：関連投稿のキャッシュウォームアップ
        import('@api/interface-adapters/repositories/Post.repository')
          .then(({ PostRepository }) => {
            const repository = new PostRepository()
            // 同じカテゴリの投稿をバックグラウンドでキャッシュ
            if (data.post.cosmeticCategory) {
              repository
                .findMany({
                  limit: 5,
                  offset: 0,
                  category: data.post.cosmeticCategory,
                  publishedOnly: true,
                  sortBy: 'recent',
                })
                .catch(console.error)
            }
          })
          .catch(console.error)
      }
    } else if (graphqlError) {
      console.error('GraphQL error in post fetch:', graphqlError)
    }
  } catch (error) {
    // エラーの場合はクライアントサイドでフェッチするためundefinedのまま
    console.error('Failed to fetch initial post data:', error)
  }

  return <PostDetailClient initialData={initialData} postId={id} />
}

export default PostDetailPage
