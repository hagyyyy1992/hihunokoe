import { Post } from '@api/domain/entities/Post'
import { PostRepository } from '@api/domain/repositories/PostRepository'

export interface UpdatePostInputData {
  postId: string
  userId: string
  title?: string
  content?: string
  productName?: string
  brandName?: string
  imageUrl?: string
  category?: string
}

export interface UpdatePostOutputData {
  post: Post
}

export class UpdatePostUseCase {
  constructor(private postRepository: PostRepository) {}

  async execute(inputData: UpdatePostInputData): Promise<UpdatePostOutputData> {
    const { postId, userId, title, content, productName, brandName, imageUrl, category } = inputData

    const post = await this.postRepository.findById(postId)

    if (!post) {
      throw new Error('Post not found')
    }

    // Check if user is the owner
    if (post.userId !== userId) {
      throw new Error('Not authorized to update this post')
    }

    // Validate fields if provided
    if (title !== undefined) {
      if (!title.trim()) {
        throw new Error('Title is required')
      }
      if (title.trim().length > 100) {
        throw new Error('Title must be 100 characters or less')
      }
    }

    if (content !== undefined) {
      if (!content.trim()) {
        throw new Error('Content is required')
      }
      if (content.trim().length > 2000) {
        throw new Error('Content must be 2000 characters or less')
      }
    }

    // Update post
    const updateData: any = {}
    if (title !== undefined) updateData.title = title.trim()
    if (content !== undefined) updateData.content = content.trim()
    if (productName !== undefined) updateData.productName = productName?.trim() || null
    if (brandName !== undefined) updateData.brandName = brandName?.trim() || null
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl?.trim() || null
    if (category !== undefined) updateData.category = category?.trim() || null

    const updatedPost = await this.postRepository.update(postId, updateData)

    return { post: updatedPost }
  }
}
