import { NextRequest } from 'next/server'
import { PostController } from '@api/framework/controllers/PostController'

const postController = new PostController()

export async function PUT(request: NextRequest) {
  return postController.updatePostByQuery(request)
}
