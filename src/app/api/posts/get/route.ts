import { NextRequest } from 'next/server'
import { ControllerFactory } from '@api/framework/factories/ControllerFactory'

const postController = ControllerFactory.createPostController()

export async function GET(request: NextRequest) {
  // クエリパラメータからIDを取得して従来のメソッドに転送
  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  if (!id) {
    return new Response(JSON.stringify({ error: 'IDが指定されていません' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  }

  const response = await postController.getPost(request, { params: { id } })

  // レスポンスヘッダーにキャッシュ無効化を追加
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  headers.set('Pragma', 'no-cache')
  headers.set('Expires', '0')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
