import { NextRequest } from 'next/server'
import { PostController } from '@api/framework/controllers/PostController'

const postController = new PostController()

export async function GET(request: NextRequest) {
  return postController.getEmpathyStatusByQuery(request)
}

export async function POST(request: NextRequest) {
  return postController.addEmpathyByQuery(request)
}

export async function DELETE(request: NextRequest) {
  return postController.removeEmpathyByQuery(request)
}
