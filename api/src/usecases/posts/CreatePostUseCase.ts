import { Post } from '@api/domain/entities/Post'
import { PostRepository } from '@api/domain/repositories/PostRepository'
import { UserRepository } from '@api/domain/repositories/UserRepository'

export interface CreatePostInputData {
  userId: string
  title: string
  content: string
  productName?: string
  brandName?: string
  imageUrl?: string
  category?: string
}

export interface CreatePostOutputData {
  post: Post
}

export class CreatePostUseCase {
  constructor(
    private postRepository: PostRepository,
    private userRepository: UserRepository
  ) {}

  async execute(inputData: CreatePostInputData): Promise<CreatePostOutputData> {
    const { userId, title, content, productName, brandName, imageUrl, category } = inputData

    // Validate user exists and is active
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    if (!user.isActive || user.deletedAt) {
      throw new Error('User account is inactive')
    }

    // Validate required fields
    if (!title?.trim()) {
      throw new Error('Title is required')
    }

    if (!content?.trim()) {
      throw new Error('Content is required')
    }

    if (title.trim().length > 100) {
      throw new Error('Title must be 100 characters or less')
    }

    if (content.trim().length > 2000) {
      throw new Error('Content must be 2000 characters or less')
    }

    // Create post
    const post = await this.postRepository.create({
      userId,
      title: title.trim(),
      content: content.trim(),
      productName: productName?.trim() || null,
      brandName: brandName?.trim() || null,
      imageUrl: imageUrl?.trim() || null,
      category: category?.trim() || null,
      isPublished: false, // Posts start as drafts
    })

    return { post }
  }
}
