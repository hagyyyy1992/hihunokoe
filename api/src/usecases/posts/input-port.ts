import {
  CreatePostOutputPort,
  UpdatePostOutputPort,
  DeletePostOutputPort,
  GetPostOutputPort,
  GetPostsOutputPort,
  AddEmpathyOutputPort,
  RemoveEmpathyOutputPort,
  GetEmpathyStatusOutputPort,
} from './output-port'

// Post Management
export abstract class IPostManagementUseCase {
  abstract createPost(inputPort: CreatePostInputPort): Promise<CreatePostOutputPort>
  abstract updatePost(inputPort: UpdatePostInputPort): Promise<UpdatePostOutputPort>
  abstract deletePost(inputPort: DeletePostInputPort): Promise<DeletePostOutputPort>
}

export type CreatePostInputPort = {
  userId: string
  title?: string
  content: string
  productName?: string
  brandName?: string
  imageUrl?: string
  category?: string
  skinType?: string
  moodTag?: string
  usageSituation?: any
  experienceDetails?: any
  ipAddress?: string
  userAgent?: string
}

export type UpdatePostInputPort = {
  postId: string
  userId: string
  title?: string
  content?: string
  productName?: string
  brandName?: string
  imageUrl?: string
  category?: string
  skinType?: string
  moodTag?: string
  usageSituation?: any
  experienceDetails?: any
  ipAddress?: string
  userAgent?: string
}

export type DeletePostInputPort = {
  postId: string
  userId: string
  ipAddress?: string
  userAgent?: string
}

// Post Retrieval
export abstract class IPostRetrievalUseCase {
  abstract getPost(inputPort: GetPostInputPort): Promise<GetPostOutputPort>
  abstract getPosts(inputPort: GetPostsInputPort): Promise<GetPostsOutputPort>
}

export type GetPostInputPort = {
  postId: string
  userId?: string
}

export type GetPostsInputPort = {
  userId?: string
  page?: number
  limit?: number
  search?: string
  category?: string
  skinType?: string
  moodTag?: string
  sortBy?: 'createdAt' | 'empathyCount'
  sortOrder?: 'asc' | 'desc'
  isPublished?: boolean
}

// Empathy Management
export abstract class IEmpathyManagementUseCase {
  abstract addEmpathy(inputPort: AddEmpathyInputPort): Promise<AddEmpathyOutputPort>
  abstract removeEmpathy(inputPort: RemoveEmpathyInputPort): Promise<RemoveEmpathyOutputPort>
  abstract getEmpathyStatus(
    inputPort: GetEmpathyStatusInputPort
  ): Promise<GetEmpathyStatusOutputPort>
}

export type AddEmpathyInputPort = {
  postId: string
  userId: string
  ipAddress?: string
  userAgent?: string
}

export type RemoveEmpathyInputPort = {
  postId: string
  userId: string
  ipAddress?: string
  userAgent?: string
}

export type GetEmpathyStatusInputPort = {
  postId: string
  userId: string
}
