import { IPostRepository } from '@api/domain/repositories/PostRepository'
import { IUserRepository } from '@api/domain/repositories/UserRepository'
import { IEmpathyRepository } from '@api/domain/repositories/EmpathyRepository'
import { ICommentRepository } from '@api/domain/repositories/CommentRepository'
import { IRateLimitService } from '@api/domain/services/RateLimitService'
import { PerformanceLogger } from '@api/lib/performance-logger'
import {
  IPostManagementUseCase,
  IPostRetrievalUseCase,
  IEmpathyManagementUseCase,
  CreatePostInputPort,
  UpdatePostInputPort,
  DeletePostInputPort,
  GetPostInputPort,
  GetPostsInputPort,
  AddEmpathyInputPort,
  RemoveEmpathyInputPort,
  GetEmpathyStatusInputPort,
} from './input-port'
import {
  CreatePostOutputPort,
  UpdatePostOutputPort,
  DeletePostOutputPort,
  GetPostOutputPort,
  GetPostsOutputPort,
  AddEmpathyOutputPort,
  RemoveEmpathyOutputPort,
  GetEmpathyStatusOutputPort,
  PostWithMetadata,
} from './output-port'

export class PostManagementUseCase implements IPostManagementUseCase {
  constructor(
    private postRepository: IPostRepository,
    private userRepository: IUserRepository,
    private empathyRepository: IEmpathyRepository,
    private commentRepository: ICommentRepository,
    private rateLimitService?: IRateLimitService
  ) {}

  async createPost(input: CreatePostInputPort): Promise<CreatePostOutputPort> {
    // レート制限チェック（30秒に1回まで）
    if (this.rateLimitService) {
      const canProceed = this.rateLimitService.checkRateLimit(
        input.userId,
        'create_post',
        30 * 1000, // 30秒
        1 // 1回まで
      )
      if (!canProceed) {
        throw new Error('投稿間隔を空けてください（30秒に1回まで）')
      }
    }

    // Validate user exists and is active
    const user = await this.userRepository.findById(input.userId)
    if (!user) {
      throw new Error('ユーザーが見つかりませんでした')
    }

    if (!user.isActive || user.deletedAt) {
      throw new Error('無効なアカウントです')
    }

    // Validate required fields
    if (!input.title?.trim()) {
      throw new Error('タイトルは必須です')
    }

    if (!input.content?.trim()) {
      throw new Error('内容は必須です')
    }

    if (input.title.trim().length > 100) {
      throw new Error('タイトルは100文字以内で入力してください')
    }

    if (input.content.trim().length > 2000) {
      throw new Error('内容は2000文字以内で入力してください')
    }

    // Create post
    const post = await this.postRepository.create({
      userId: input.userId,
      title: input.title.trim(),
      content: input.content.trim(),
      productName: input.productName?.trim() || null,
      brandName: input.brandName?.trim() || null,
      imageUrl: input.imageUrl?.trim() || null,
      category: input.category?.trim() || null,
      skinType: input.skinType?.trim() || null,
      moodTag: input.moodTag?.trim() || null,
      usageSituation: input.usageSituation || null,
      experienceDetails: input.experienceDetails || null,
      isPublished: true, // Published immediately in current implementation
    })

    // エンパシー数とコメント数を取得（新規投稿なので0）
    const empathyCount = 0
    const commentCount = 0

    return {
      post,
      user,
      empathyCount,
      commentCount,
      message: '投稿を作成しました',
    }
  }

  async updatePost(input: UpdatePostInputPort): Promise<UpdatePostOutputPort> {
    // 投稿の存在確認
    const post = await this.postRepository.findById(input.postId)
    if (!post) {
      throw new Error('投稿が見つかりませんでした')
    }

    // 権限確認（作成者のみ編集可能）
    if (post.userId !== input.userId) {
      throw new Error('この投稿を編集する権限がありません')
    }

    // バリデーション
    if (input.title !== undefined) {
      if (!input.title?.trim()) {
        throw new Error('タイトルは必須です')
      }
      if (input.title.trim().length > 100) {
        throw new Error('タイトルは100文字以内で入力してください')
      }
    }

    if (input.content !== undefined) {
      if (!input.content?.trim()) {
        throw new Error('内容は必須です')
      }
      if (input.content.trim().length > 2000) {
        throw new Error('内容は2000文字以内で入力してください')
      }
    }

    // 更新データを構築
    const updateData: any = {}
    if (input.title !== undefined) updateData.title = input.title.trim()
    if (input.content !== undefined) updateData.content = input.content.trim()
    if (input.productName !== undefined) updateData.productName = input.productName?.trim() || null
    if (input.brandName !== undefined) updateData.brandName = input.brandName?.trim() || null
    if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl?.trim() || null
    if (input.category !== undefined) updateData.category = input.category?.trim() || null
    if (input.skinType !== undefined) updateData.skinType = input.skinType?.trim() || null
    if (input.moodTag !== undefined) updateData.moodTag = input.moodTag?.trim() || null
    if (input.usageSituation !== undefined) updateData.usageSituation = input.usageSituation
    if (input.experienceDetails !== undefined)
      updateData.experienceDetails = input.experienceDetails

    // 投稿更新
    const updatedPost = await this.postRepository.update(input.postId, updateData)

    // ユーザー情報、エンパシー数、コメント数、ユーザーのエンパシー状態を並列で取得
    const [user, empathyCount, commentCount, userEmpathy] = await Promise.all([
      this.userRepository.findById(updatedPost.userId),
      this.empathyRepository.countByPost(updatedPost.id),
      this.commentRepository.countByPostId(updatedPost.id),
      this.empathyRepository.findByUserAndPost(input.userId, updatedPost.id),
    ])
    if (!user) throw new Error('ユーザーが見つかりませんでした')
    return {
      post: updatedPost,
      user,
      empathyCount,
      commentCount,
      userHasEmpathy: userEmpathy !== null,
      message: '投稿を更新しました',
    }
  }

  async deletePost(input: DeletePostInputPort): Promise<DeletePostOutputPort> {
    // 投稿の存在確認
    const post = await this.postRepository.findById(input.postId)
    if (!post) {
      throw new Error('投稿が見つかりませんでした')
    }

    // 権限確認（作成者のみ削除可能）
    if (post.userId !== input.userId) {
      throw new Error('この投稿を削除する権限がありません')
    }

    // 投稿削除
    await this.postRepository.delete(input.postId)

    return {
      postId: input.postId,
      message: '投稿を削除しました',
    }
  }
}

export class PostRetrievalUseCase implements IPostRetrievalUseCase {
  constructor(
    private postRepository: IPostRepository,
    private userRepository: IUserRepository,
    private empathyRepository: IEmpathyRepository,
    private commentRepository: ICommentRepository
  ) {}

  async getPost(input: GetPostInputPort): Promise<GetPostOutputPort> {
    const post = await this.postRepository.findById(input.postId)
    if (!post) {
      throw new Error('投稿が見つかりませんでした')
    }

    // 非公開投稿の場合、作成者以外はアクセス不可
    if (!post.isPublished && post.userId !== input.userId) {
      throw new Error('この投稿は非公開です')
    }

    // ユーザー情報、エンパシー数、コメント数、ユーザーのエンパシー状態を並列で取得
    const [user, empathyCount, commentCount, userEmpathy] = await Promise.all([
      this.userRepository.findById(post.userId),
      this.empathyRepository.countByPost(input.postId),
      this.commentRepository.countByPostId(input.postId),
      input.userId
        ? this.empathyRepository.findByUserAndPost(input.userId, input.postId)
        : Promise.resolve(null),
    ])

    if (!user) {
      throw new Error('ユーザーが見つかりませんでした')
    }

    return {
      post,
      user,
      empathyCount,
      commentCount,
      userHasEmpathy: !!userEmpathy,
    }
  }

  async getPosts(input: GetPostsInputPort): Promise<GetPostsOutputPort> {
    const perfLogger = new PerformanceLogger('PostRetrievalUseCase.getPosts', { input })

    perfLogger.start('prepare-params')
    const page = input.page || 1
    const limit = input.limit || 20
    const offset = (page - 1) * limit

    // 公開投稿のみを取得（全ユーザーの投稿を表示）
    const isPublished = true

    const sortBy = input.sortBy || 'createdAt'
    const sortOrder = input.sortOrder || 'desc'
    perfLogger.end('prepare-params')

    perfLogger.start('repository-findMany')
    const { posts, totalCount } = await this.postRepository.findMany({
      offset,
      limit,
      search: input.search,
      category: input.category,
      skinType: input.skinType,
      moodTag: input.moodTag,
      publishedOnly: isPublished,
      sortBy: sortBy as any,
      // userIdは削除 - 全ユーザーの投稿を取得する
    })
    perfLogger.end('repository-findMany', { postCount: posts.length, totalCount })

    // ユーザー情報と共感状態を並列で取得
    perfLogger.start('fetch-related-data')
    const userIds = [...new Set(posts.map(p => p.userId))]

    const [users, userEmpathiesData] = await Promise.all([
      // ユーザー情報を一括取得
      Promise.all(userIds.map(id => this.userRepository.findById(id))),
      // ユーザーの共感状態を取得
      input.userId
        ? this.empathyRepository.findByUserAndPosts(
            input.userId,
            posts.map(p => p.id)
          )
        : Promise.resolve([]),
    ])

    // ユーザーマップを作成
    const userMap = new Map(users.filter(u => u !== null).map(u => [u!.id, u!]))

    // 共感状態マップを作成
    const userEmpathies: Map<string, boolean> = new Map()
    userEmpathiesData.forEach(empathy => {
      userEmpathies.set(empathy.postId, true)
    })

    perfLogger.end('fetch-related-data', {
      userCount: userIds.length,
      hasUser: !!input.userId,
      empathyCount: userEmpathiesData.length,
    })

    // 各投稿にユーザー情報と共感状態を追加
    perfLogger.start('build-metadata')
    const postsWithMetadata: PostWithMetadata[] = posts.map(post => {
      const user = userMap.get(post.userId)
      if (!user) {
        throw new Error(`ユーザーが見つかりませんでした: ${post.userId}`)
      }
      const userHasEmpathy = userEmpathies.get(post.id) || false

      // Postエンティティを拡張してメタデータを追加
      return Object.assign(post, {
        user,
        userHasEmpathy,
      })
    })
    perfLogger.end('build-metadata')

    const hasNext = offset + posts.length < totalCount

    const result = {
      posts: postsWithMetadata,
      total: totalCount,
      page,
      limit,
      hasNext,
    }

    perfLogger.finish({ success: true, resultCount: postsWithMetadata.length })
    return result
  }
}

export class EmpathyManagementUseCase implements IEmpathyManagementUseCase {
  constructor(
    private postRepository: IPostRepository,
    private userRepository: IUserRepository,
    private empathyRepository: IEmpathyRepository,
    private rateLimitService?: IRateLimitService
  ) {}

  async addEmpathy(input: AddEmpathyInputPort): Promise<AddEmpathyOutputPort> {
    // レート制限チェック（1秒に1回まで）
    if (this.rateLimitService) {
      const canProceed = this.rateLimitService.checkRateLimit(
        input.userId,
        'empathy_action',
        1 * 1000, // 1秒
        1 // 1回まで
      )
      if (!canProceed) {
        throw new Error('操作間隔を空けてください')
      }
    }

    // 投稿の存在確認
    const post = await this.postRepository.findById(input.postId)
    if (!post) {
      throw new Error('投稿が見つかりませんでした')
    }

    if (!post.isPublished) {
      throw new Error('この投稿にはエンパシーできません')
    }

    // ユーザーの存在確認
    const user = await this.userRepository.findById(input.userId)
    if (!user) {
      throw new Error('ユーザーが見つかりませんでした')
    }

    if (!user.isActive || user.deletedAt) {
      throw new Error('無効なアカウントです')
    }

    // 自分の投稿にはエンパシーできない
    if (post.userId === input.userId) {
      throw new Error('自分の投稿にはエンパシーできません')
    }

    // 既にエンパシーしているかチェック
    const existingEmpathy = await this.empathyRepository.findByUserAndPost(
      input.userId,
      input.postId
    )
    if (existingEmpathy) {
      throw new Error('既にエンパシーしています')
    }

    // エンパシーを追加
    const empathy = await this.empathyRepository.create({
      postId: input.postId,
      userId: input.userId,
      empathyType: 'helpful' as const,
    })

    // 更新後の総数を取得
    const totalCount = await this.empathyRepository.countByPost(input.postId)

    return {
      empathy,
      totalCount,
      message: 'エンパシーを追加しました',
    }
  }

  async removeEmpathy(input: RemoveEmpathyInputPort): Promise<RemoveEmpathyOutputPort> {
    // レート制限チェック（1秒に1回まで）
    if (this.rateLimitService) {
      const canProceed = this.rateLimitService.checkRateLimit(
        input.userId,
        'empathy_action',
        1 * 1000, // 1秒
        1 // 1回まで
      )
      if (!canProceed) {
        throw new Error('操作間隔を空けてください')
      }
    }

    // エンパシーの存在確認
    const empathy = await this.empathyRepository.findByUserAndPost(input.userId, input.postId)
    if (!empathy) {
      throw new Error('エンパシーが見つかりませんでした')
    }

    // エンパシーを削除
    await this.empathyRepository.delete(empathy.id)

    // 更新後の総数を取得
    const totalCount = await this.empathyRepository.countByPost(input.postId)

    return {
      totalCount,
      message: 'エンパシーを削除しました',
    }
  }

  async getEmpathyStatus(input: GetEmpathyStatusInputPort): Promise<GetEmpathyStatusOutputPort> {
    // 投稿の存在確認
    const post = await this.postRepository.findById(input.postId)
    if (!post) {
      throw new Error('投稿が見つかりませんでした')
    }

    // エンパシー状態を取得
    const empathy = await this.empathyRepository.findByUserAndPost(input.userId, input.postId)
    const hasEmpathy = !!empathy
    const empathyCount = await this.empathyRepository.countByPost(input.postId)

    return {
      hasEmpathy,
      empathyCount,
    }
  }
}
