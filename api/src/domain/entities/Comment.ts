export class Comment {
  constructor(
    public readonly id: string,
    public readonly postId: string,
    public readonly userId: string,
    public readonly content: string,
    public readonly parentCommentId: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  get isValid(): boolean {
    return this.content.trim().length > 0 && this.content.trim().length <= 1000
  }

  get isReply(): boolean {
    return this.parentCommentId !== null
  }

  get isRootComment(): boolean {
    return this.parentCommentId === null
  }

  canBeRepliedTo(): boolean {
    return this.isActive && this.isRootComment
  }

  canBeEditedBy(userId: string): boolean {
    return this.userId === userId && this.isActive
  }

  canBeDeletedBy(userId: string): boolean {
    return this.userId === userId && this.isActive
  }
}
