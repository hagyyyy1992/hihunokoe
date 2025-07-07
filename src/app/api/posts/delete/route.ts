import { NextRequest } from 'next/server'
import { PostController } from '@api/framework/controllers/PostController'

const postController = new PostController()

export async function DELETE(request: NextRequest) {
  return postController.deletePostByQuery(request)
}
