import { NextRequest } from 'next/server'
import { ControllerFactory } from '@api/framework/factories/ControllerFactory'

const postController = ControllerFactory.createPostController()

export async function GET(request: NextRequest) {
  const response = await postController.getPosts(request)

  // キャッシュヘッダーを設定（公開コンテンツは30秒キャッシュ）
  if (response.status === 200) {
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=59')
  }

  return response
}

export async function POST(request: NextRequest) {
  return postController.createPost(request)
}
