import { Comment } from '@api/domain/entities/Comment'

export interface ICommentRepository {
  create(
    postId: string,
    userId: string,
    content: string,
    parentCommentId?: string | null
  ): Promise<Comment>

  findById(id: string): Promise<Comment | null>

  findByPostId(postId: string): Promise<Comment[]>

  findByUserId(userId: string): Promise<Comment[]>

  findRepliesByParentId(parentCommentId: string): Promise<Comment[]>

  update(id: string, content: string): Promise<Comment | null>

  delete(id: string): Promise<boolean>

  softDelete(id: string): Promise<boolean>

  exists(id: string): Promise<boolean>

  existsAndIsActive(id: string): Promise<boolean>

  countByPostId(postId: string): Promise<number>

  countRepliesByParentId(parentCommentId: string): Promise<number>

  findByPostIdWithPagination(postId: string, skip: number, limit: number): Promise<Comment[]>
}
