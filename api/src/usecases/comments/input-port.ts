import {
  CreateCommentOutputPort,
  CreateReplyOutputPort,
  GetCommentOutputPort,
  GetCommentsOutputPort,
  GetCommentsWithPaginationOutputPort,
  UpdateCommentOutputPort,
  DeleteCommentOutputPort,
} from './output-port'

// Comment Management
export abstract class ICommentManagementUseCase {
  abstract createComment(inputPort: CreateCommentInputPort): Promise<CreateCommentOutputPort>
  abstract createReply(inputPort: CreateReplyInputPort): Promise<CreateReplyOutputPort>
  abstract updateComment(inputPort: UpdateCommentInputPort): Promise<UpdateCommentOutputPort>
  abstract deleteComment(inputPort: DeleteCommentInputPort): Promise<DeleteCommentOutputPort>
}

export type CreateCommentInputPort = {
  postId: string
  userId: string
  content: string
  ipAddress?: string
  userAgent?: string
}

export type CreateReplyInputPort = {
  postId: string
  parentCommentId: string
  userId: string
  content: string
  ipAddress?: string
  userAgent?: string
}

export type UpdateCommentInputPort = {
  commentId: string
  userId: string
  content: string
  ipAddress?: string
  userAgent?: string
}

export type DeleteCommentInputPort = {
  commentId: string
  userId: string
  ipAddress?: string
  userAgent?: string
}

// Comment Retrieval
export abstract class ICommentRetrievalUseCase {
  abstract getComment(inputPort: GetCommentInputPort): Promise<GetCommentOutputPort>
  abstract getComments(inputPort: GetCommentsInputPort): Promise<GetCommentsOutputPort>
  abstract getCommentsWithPagination(
    inputPort: GetCommentsWithPaginationInputPort
  ): Promise<GetCommentsWithPaginationOutputPort>
}

export type GetCommentInputPort = {
  commentId: string
  userId?: string
}

export type GetCommentsInputPort = {
  postId: string
  userId?: string
}

export type GetCommentsWithPaginationInputPort = {
  postId: string
  page?: number
  limit?: number
  userId?: string
}
