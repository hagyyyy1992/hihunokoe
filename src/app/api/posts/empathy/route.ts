import { NextRequest } from 'next/server'
import { ControllerFactory } from '@api/framework/factories/ControllerFactory'
import { ErrorHandler } from '@api/framework/errors/ErrorHandler'
import { ApplicationError } from '@api/framework/errors/ApplicationError'

const postController = ControllerFactory.createPostController()

export async function GET(request: NextRequest) {
  // クエリパラメータからIDを取得して従来のメソッドに転送
  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  if (!id) {
    return ErrorHandler.handle(ApplicationError.validationError(['投稿IDが指定されていません']))
  }

  return postController.getEmpathyStatus(request, { params: { id } })
}

export async function POST(request: NextRequest) {
  // クエリパラメータからIDを取得して従来のメソッドに転送
  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  if (!id) {
    return ErrorHandler.handle(ApplicationError.validationError(['投稿IDが指定されていません']))
  }

  return postController.addEmpathy(request, { params: { id } })
}

export async function DELETE(request: NextRequest) {
  // クエリパラメータからIDを取得して従来のメソッドに転送
  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  if (!id) {
    return ErrorHandler.handle(ApplicationError.validationError(['投稿IDが指定されていません']))
  }

  return postController.removeEmpathy(request, { params: { id } })
}
