import { NextRequest } from 'next/server'
import { ControllerFactory } from '@api/framework/factories/ControllerFactory'

const postController = ControllerFactory.createPostController()

export async function DELETE(request: NextRequest) {
  // クエリパラメータからIDを取得して従来のメソッドに転送
  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  if (!id) {
    return new Response(JSON.stringify({ error: 'IDが指定されていません' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return postController.deletePost(request, { params: { id } })
}
