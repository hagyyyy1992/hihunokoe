import { ApplicationError } from '@api/framework/errors/ApplicationError'
import { categoryLabels, skinTypeLabels, moodTagLabels } from '@/lib/constants/categories'

export interface CreatePostRequest {
  userId: string
  title?: string
  content: string
  productName?: string
  brandName?: string
  color?: string
  imageUrl?: string
  category: string
  skinType?: string
  moodTag?: string
  usageSituation?: string
  experienceDetails?: string
}

export interface UpdatePostRequest {
  postId: string
  userId: string
  title?: string
  content?: string
  productName?: string
  brandName?: string
  color?: string
  imageUrl?: string
  category?: string
  skinType?: string
  moodTag?: string
  usageSituation?: string
  experienceDetails?: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export class PostValidator {
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  private static readonly VALID_CATEGORIES = Object.keys(categoryLabels)
  private static readonly VALID_SKIN_TYPES = Object.keys(skinTypeLabels)
  private static readonly VALID_MOOD_TAGS = Object.keys(moodTagLabels)
  private static readonly VALID_SORT_BY = ['recent', 'popular']
  private static readonly VALID_EMPATHY_TYPES = ['helpful', 'interested', 'supportive']

  static validatePostId(postId: string | null): string {
    if (!postId) {
      throw ApplicationError.validationError(['投稿IDが指定されていません'])
    }
    if (!this.UUID_REGEX.test(postId)) {
      throw ApplicationError.validationError(['無効な投稿IDです'])
    }
    return postId
  }

  static validateUserId(userId: string | null): string {
    if (!userId) {
      throw ApplicationError.unauthorized()
    }
    if (!this.UUID_REGEX.test(userId)) {
      throw ApplicationError.validationError(['無効なユーザーIDです'])
    }
    return userId
  }

  static validateCreatePost(data: any): CreatePostRequest {
    const errors: string[] = []

    // タイトルの検証（任意項目）
    if (data.title && typeof data.title === 'string') {
      if (data.title.length > 100) {
        errors.push('タイトルは100文字以内で入力してください')
      }
    }

    if (!data.content || typeof data.content !== 'string') {
      errors.push('本文は必須です')
    } else if (data.content.length < 1 || data.content.length > 5000) {
      errors.push('本文は1文字以上5000文字以内で入力してください')
    }

    // 商品名は任意項目に変更
    if (data.productName && typeof data.productName === 'string' && data.productName.length > 100) {
      errors.push('商品名は100文字以内で入力してください')
    }

    if (!data.category || !this.VALID_CATEGORIES.includes(data.category)) {
      errors.push('有効なカテゴリーを選択してください')
    }

    // オプションフィールドの検証
    if (data.brandName && typeof data.brandName === 'string' && data.brandName.length > 100) {
      errors.push('ブランド名は100文字以内で入力してください')
    }

    if (data.color && typeof data.color === 'string' && data.color.length > 50) {
      errors.push('色は50文字以内で入力してください')
    }

    if (data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.length > 500) {
      errors.push('画像URLは500文字以内で入力してください')
    }

    if (data.skinType && !this.VALID_SKIN_TYPES.includes(data.skinType)) {
      errors.push('有効な肌タイプを選択してください')
    }

    if (data.moodTag && !this.VALID_MOOD_TAGS.includes(data.moodTag)) {
      errors.push('有効なムードタグを選択してください')
    }

    if (data.usageSituation) {
      const usageSituationStr =
        typeof data.usageSituation === 'object'
          ? JSON.stringify(data.usageSituation)
          : data.usageSituation
      if (typeof usageSituationStr === 'string' && usageSituationStr.length > 2000) {
        errors.push('使用場面は2000文字以内で入力してください')
      }
    }

    if (data.experienceDetails) {
      const experienceDetailsStr =
        typeof data.experienceDetails === 'object'
          ? JSON.stringify(data.experienceDetails)
          : data.experienceDetails
      if (typeof experienceDetailsStr === 'string' && experienceDetailsStr.length > 5000) {
        errors.push('体験詳細は5000文字以内で入力してください')
      }
    }

    if (errors.length > 0) {
      throw ApplicationError.validationError(errors)
    }

    return {
      userId: data.userId,
      title: data.title?.trim(),
      content: data.content.trim(),
      productName: data.productName?.trim(),
      brandName: data.brandName?.trim(),
      color: data.color?.trim(),
      imageUrl: data.imageUrl?.trim(),
      category: data.category,
      skinType: data.skinType,
      moodTag: data.moodTag,
      usageSituation:
        data.usageSituation && typeof data.usageSituation === 'object'
          ? JSON.stringify(data.usageSituation)
          : data.usageSituation?.trim?.(),
      experienceDetails:
        data.experienceDetails && typeof data.experienceDetails === 'object'
          ? JSON.stringify(data.experienceDetails)
          : data.experienceDetails?.trim?.(),
    }
  }

  static validateUpdatePost(data: any): UpdatePostRequest {
    const errors: string[] = []

    // 少なくとも1つのフィールドが必要
    const updateableFields = [
      'title',
      'content',
      'productName',
      'brandName',
      'color',
      'imageUrl',
      'category',
      'skinType',
      'moodTag',
      'usageSituation',
      'experienceDetails',
    ]
    const hasUpdateField = updateableFields.some(field => field in data)
    if (!hasUpdateField) {
      errors.push('更新するフィールドを指定してください')
    }

    // 各フィールドの検証（nullを許可して空更新を可能にする）
    if ('title' in data && data.title !== null && data.title !== undefined) {
      if (typeof data.title !== 'string' || data.title.length > 100) {
        errors.push('タイトルは100文字以内で入力してください')
      }
    }

    if ('content' in data && data.content !== null && data.content !== undefined) {
      if (
        typeof data.content !== 'string' ||
        data.content.length < 1 ||
        data.content.length > 5000
      ) {
        errors.push('本文は1文字以上5000文字以内で入力してください')
      }
    }

    if ('productName' in data && data.productName !== null && data.productName !== undefined) {
      if (typeof data.productName !== 'string' || data.productName.length > 100) {
        errors.push('商品名は100文字以内で入力してください')
      }
    }

    if ('brandName' in data && data.brandName !== null && data.brandName !== undefined) {
      if (typeof data.brandName !== 'string' || data.brandName.length > 100) {
        errors.push('ブランド名は100文字以内で入力してください')
      }
    }

    if ('color' in data && data.color !== null && data.color !== undefined) {
      if (typeof data.color !== 'string' || data.color.length > 50) {
        errors.push('色は50文字以内で入力してください')
      }
    }

    if ('imageUrl' in data && data.imageUrl !== null && data.imageUrl !== undefined) {
      if (typeof data.imageUrl !== 'string' || data.imageUrl.length > 500) {
        errors.push('画像URLは500文字以内で入力してください')
      }
    }

    if ('category' in data && data.category !== null && data.category !== undefined) {
      if (!this.VALID_CATEGORIES.includes(data.category)) {
        errors.push('有効なカテゴリーを選択してください')
      }
    }

    if (
      'skinType' in data &&
      data.skinType !== null &&
      data.skinType !== undefined &&
      data.skinType !== ''
    ) {
      if (!this.VALID_SKIN_TYPES.includes(data.skinType)) {
        errors.push('有効な肌タイプを選択してください')
      }
    }

    if (
      'moodTag' in data &&
      data.moodTag !== null &&
      data.moodTag !== undefined &&
      data.moodTag !== ''
    ) {
      if (!this.VALID_MOOD_TAGS.includes(data.moodTag)) {
        errors.push('有効なムードタグを選択してください')
      }
    }

    if ('usageSituation' in data && data.usageSituation !== null) {
      // オブジェクトの場合はJSONに変換
      const usageSituationStr =
        typeof data.usageSituation === 'object'
          ? JSON.stringify(data.usageSituation)
          : data.usageSituation
      if (typeof usageSituationStr === 'string' && usageSituationStr.length > 2000) {
        errors.push('使用場面は2000文字以内で入力してください')
      }
    }

    if ('experienceDetails' in data && data.experienceDetails !== null) {
      // オブジェクトの場合はJSONに変換
      const experienceDetailsStr =
        typeof data.experienceDetails === 'object'
          ? JSON.stringify(data.experienceDetails)
          : data.experienceDetails
      if (typeof experienceDetailsStr === 'string' && experienceDetailsStr.length > 5000) {
        errors.push('体験詳細は5000文字以内で入力してください')
      }
    }

    if (errors.length > 0) {
      throw ApplicationError.validationError(errors)
    }

    // 空文字列をnullに変換する関数
    const convertEmptyToNull = (value: any) => {
      if (value === null || value === undefined) return null
      if (typeof value === 'string' && value.trim() === '') return null
      return typeof value === 'string' ? value.trim() : value
    }

    return {
      postId: data.postId,
      userId: data.userId,
      title: 'title' in data ? convertEmptyToNull(data.title) : undefined,
      content: 'content' in data ? convertEmptyToNull(data.content) : undefined,
      productName: 'productName' in data ? convertEmptyToNull(data.productName) : undefined,
      brandName: 'brandName' in data ? convertEmptyToNull(data.brandName) : undefined,
      color: 'color' in data ? convertEmptyToNull(data.color) : undefined,
      imageUrl: 'imageUrl' in data ? convertEmptyToNull(data.imageUrl) : undefined,
      category: 'category' in data ? data.category : undefined,
      skinType: data.skinType === '' ? null : data.skinType,
      moodTag: data.moodTag === '' ? null : data.moodTag,
      usageSituation:
        'usageSituation' in data
          ? data.usageSituation && typeof data.usageSituation === 'object'
            ? JSON.stringify(data.usageSituation)
            : convertEmptyToNull(data.usageSituation)
          : undefined,
      experienceDetails:
        'experienceDetails' in data
          ? data.experienceDetails && typeof data.experienceDetails === 'object'
            ? JSON.stringify(data.experienceDetails)
            : convertEmptyToNull(data.experienceDetails)
          : undefined,
    }
  }

  static validatePagination(page: string | null, limit: string | null): PaginationParams
  static validatePagination(page: number, limit: number): PaginationParams
  static validatePagination(
    page: string | null | number,
    limit: string | null | number
  ): PaginationParams {
    const parsedPage = typeof page === 'number' ? page : parseInt(page || '1', 10)
    const parsedLimit = typeof limit === 'number' ? limit : parseInt(limit || '10', 10)

    const errors: string[] = []

    if (isNaN(parsedPage) || parsedPage < 1) {
      errors.push('ページ番号は1以上の整数で指定してください')
    }

    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      errors.push('取得件数は1以上100以下の整数で指定してください')
    }

    if (errors.length > 0) {
      throw ApplicationError.validationError(errors)
    }

    return { page: parsedPage, limit: parsedLimit }
  }

  static validateEmpathyType(empathyType: any): string {
    if (!empathyType) {
      throw ApplicationError.validationError(['empathyTypeが指定されていません'])
    }
    if (!this.VALID_EMPATHY_TYPES.includes(empathyType)) {
      throw ApplicationError.validationError(['無効なempathyTypeです'])
    }
    return empathyType
  }

  static validateCategory(category: string | null): string | undefined {
    if (!category) return undefined
    if (!this.VALID_CATEGORIES.includes(category)) {
      throw ApplicationError.validationError(['無効なカテゴリーです'])
    }
    return category
  }

  static validateSkinType(skinType: string | null): string | undefined {
    if (!skinType) return undefined
    if (!this.VALID_SKIN_TYPES.includes(skinType)) {
      throw ApplicationError.validationError(['無効な肌タイプです'])
    }
    return skinType
  }

  static validateMoodTag(moodTag: string | null): string | undefined {
    if (!moodTag) return undefined
    if (!this.VALID_MOOD_TAGS.includes(moodTag)) {
      throw ApplicationError.validationError(['無効なムードタグです'])
    }
    return moodTag
  }

  static validateSortBy(sortBy: string | null): 'createdAt' | 'empathyCount' {
    if (!sortBy || sortBy === 'recent') return 'createdAt'
    if (sortBy === 'popular') return 'empathyCount'
    throw ApplicationError.validationError(['無効なソート順です'])
  }

  static validateSearch(search: string | null): string | undefined {
    if (!search) return undefined
    const trimmed = search.trim()
    if (trimmed.length > 100) {
      throw ApplicationError.validationError(['検索キーワードは100文字以内で入力してください'])
    }
    return trimmed
  }
}
