import { ApplicationError } from '../errors/ApplicationError'

export interface CreateCommentRequest {
  content: string
  postId: string
}

export interface UpdateCommentRequest {
  content: string
}

export class CommentValidator {
  static validateCreateComment(data: any): CreateCommentRequest {
    const errors: string[] = []

    if (!data.content || typeof data.content !== 'string') {
      errors.push('コメント内容は必須です')
    } else if (data.content.trim().length === 0) {
      errors.push('コメント内容を入力してください')
    } else if (data.content.length > 1000) {
      errors.push('コメントは1000文字以内で入力してください')
    }

    if (!data.postId || typeof data.postId !== 'string') {
      errors.push('投稿IDは必須です')
    } else if (!this.isValidUUID(data.postId)) {
      errors.push('投稿IDの形式が不正です')
    }

    if (errors.length > 0) {
      throw ApplicationError.validationError(errors)
    }

    return {
      content: data.content.trim(),
      postId: data.postId,
    }
  }

  static validateUpdateComment(data: any): UpdateCommentRequest {
    const errors: string[] = []

    if (!data.content || typeof data.content !== 'string') {
      errors.push('コメント内容は必須です')
    } else if (data.content.trim().length === 0) {
      errors.push('コメント内容を入力してください')
    } else if (data.content.length > 1000) {
      errors.push('コメントは1000文字以内で入力してください')
    }

    if (errors.length > 0) {
      throw ApplicationError.validationError(errors)
    }

    return {
      content: data.content.trim(),
    }
  }

  static validateCommentId(commentId: string | null): string {
    if (!commentId) {
      throw ApplicationError.validationError(['コメントIDは必須です'])
    }

    if (!this.isValidUUID(commentId)) {
      throw ApplicationError.validationError(['コメントIDの形式が不正です'])
    }

    return commentId
  }

  static validatePostId(postId: string | null): string {
    if (!postId) {
      throw ApplicationError.validationError(['投稿IDは必須です'])
    }

    if (!this.isValidUUID(postId)) {
      throw ApplicationError.validationError(['投稿IDの形式が不正です'])
    }

    return postId
  }

  private static isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
    return uuidRegex.test(uuid)
  }
}
