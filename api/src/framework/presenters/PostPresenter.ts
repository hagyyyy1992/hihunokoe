import { Post } from '@api/domain/entities/Post'
import { User } from '@api/domain/entities/User'
import { Empathy } from '@api/domain/entities/Empathy'
import { NextResponse } from 'next/server'

export interface PostResponse {
  id: string
  title?: string
  content: string
  productName: string
  cosmeticName?: string // 下位互換性のため追加
  brandName?: string
  color?: string
  imageUrl?: string
  category: string
  cosmeticCategory?: string // 下位互換性のため追加
  skinType?: string
  moodTag?: string
  usageSituation?: string
  experienceDetails?: string
  empathyCount: number
  commentCount: number
  userHasEmpathy?: boolean
  createdAt: string
  publishedAt: string // 下位互換性のため追加
  updatedAt: string
  user: {
    id: string
    userName: string
    skinType?: string
    profileImageUrl?: string
  }
}

export interface PostListResponse {
  posts: PostResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface EmpathyResponse {
  id: string
  postId: string
  userId: string
  empathyType: string
  createdAt: string
}

export interface SuccessResponse<T = any> {
  success: true
  data?: T
  message?: string
}

export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

export class PostPresenter {
  static toResponse(
    post: Post,
    user: User,
    empathyCount: number,
    commentCount: number,
    userHasEmpathy?: boolean
  ): PostResponse {
    return {
      id: post.id,
      title: post.title || undefined,
      content: post.content,
      productName: post.productName || post.cosmeticName || '',
      cosmeticName: post.cosmeticName || post.productName || '', // 下位互換性
      brandName: post.brandName || undefined,
      color: post.color || undefined,
      imageUrl: post.imageUrl || undefined,
      category: post.category || post.cosmeticCategory || '',
      cosmeticCategory: post.cosmeticCategory || post.category || '', // 下位互換性
      skinType: post.skinType || undefined,
      moodTag: post.moodTag || undefined,
      usageSituation: post.usageSituation || undefined,
      experienceDetails: post.experienceDetails || undefined,
      empathyCount,
      commentCount,
      userHasEmpathy,
      createdAt: post.createdAt.toISOString(),
      publishedAt: post.createdAt.toISOString(), // 下位互換性のため createdAt と同じ値
      updatedAt: post.updatedAt.toISOString(),
      user: {
        id: user.id,
        userName: user.userName,
        skinType: user.skinType || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
      },
    }
  }

  static toResponseWithPostData(post: Post, userHasEmpathy?: boolean): PostResponse {
    return {
      id: post.id,
      title: post.title || undefined,
      content: post.content,
      productName: post.productName || post.cosmeticName || '',
      cosmeticName: post.cosmeticName || post.productName || '', // 下位互換性
      brandName: post.brandName || undefined,
      color: post.color || undefined,
      imageUrl: post.imageUrl || undefined,
      category: post.category || post.cosmeticCategory || '',
      cosmeticCategory: post.cosmeticCategory || post.category || '', // 下位互換性
      skinType: post.skinType || undefined,
      moodTag: post.moodTag || undefined,
      usageSituation: post.usageSituation || undefined,
      experienceDetails: post.experienceDetails || undefined,
      empathyCount: post.empathyCount,
      commentCount: post.commentCount,
      userHasEmpathy,
      createdAt: post.createdAt.toISOString(),
      publishedAt: post.createdAt.toISOString(), // 下位互換性のため createdAt と同じ値
      updatedAt: post.updatedAt.toISOString(),
      user: {
        id: post.userId,
        userName: post.user?.userName || 'Unknown User',
        skinType: undefined,
        profileImageUrl: undefined,
      },
    }
  }

  static toResponseWithMetadata(
    post: Post & { user: User; userHasEmpathy?: boolean }
  ): PostResponse {
    return {
      id: post.id,
      title: post.title || undefined,
      content: post.content,
      productName: post.productName || post.cosmeticName || '',
      cosmeticName: post.cosmeticName || post.productName || '', // 下位互換性
      brandName: post.brandName || undefined,
      color: post.color || undefined,
      imageUrl: post.imageUrl || undefined,
      category: post.category || post.cosmeticCategory || '',
      cosmeticCategory: post.cosmeticCategory || post.category || '', // 下位互換性
      skinType: post.skinType || undefined,
      moodTag: post.moodTag || undefined,
      usageSituation: post.usageSituation || undefined,
      experienceDetails: post.experienceDetails || undefined,
      empathyCount: post.empathyCount,
      commentCount: post.commentCount,
      userHasEmpathy: post.userHasEmpathy,
      createdAt: post.createdAt.toISOString(),
      publishedAt: post.createdAt.toISOString(), // 下位互換性のため createdAt と同じ値
      updatedAt: post.updatedAt.toISOString(),
      user: {
        id: post.user.id,
        userName: post.user.userName,
        skinType: post.user.skinType || undefined,
        profileImageUrl: post.user.profileImageUrl || undefined,
      },
    }
  }

  static toEmpathyResponse(empathy: Empathy): EmpathyResponse {
    return {
      id: empathy.id,
      postId: empathy.postId,
      userId: empathy.userId,
      empathyType: empathy.empathyType,
      createdAt: empathy.createdAt.toISOString(),
    }
  }

  static presentSuccess<T = any>(
    data?: T,
    message?: string,
    status: number = 200
  ): NextResponse<SuccessResponse<T>> {
    return NextResponse.json(
      {
        success: true,
        data,
        message,
      },
      { status }
    )
  }

  static presentCreated(
    post: PostResponse,
    message: string = '投稿が作成されました'
  ): NextResponse<SuccessResponse<{ post: PostResponse }>> {
    return this.presentSuccess({ post }, message, 201)
  }

  static presentUpdated(
    post: PostResponse,
    message: string = '投稿が更新されました'
  ): NextResponse<SuccessResponse<{ post: PostResponse }>> {
    return this.presentSuccess({ post }, message, 200)
  }

  static presentDeleted(message: string = '投稿が削除されました'): NextResponse<SuccessResponse> {
    return this.presentSuccess(undefined, message, 200)
  }

  static presentPost(post: PostResponse): NextResponse<SuccessResponse<{ post: PostResponse }>> {
    return this.presentSuccess({ post }, undefined, 200)
  }

  static presentPostList(
    posts: PostResponse[],
    pagination: PostListResponse['pagination']
  ): NextResponse<SuccessResponse<PostListResponse>> {
    return this.presentSuccess({ posts, pagination }, undefined, 200)
  }

  static presentEmpathyAdded(
    empathy: EmpathyResponse,
    totalCount: number,
    message: string = '共感を追加しました'
  ): NextResponse<
    SuccessResponse<{
      empathy: EmpathyResponse
      totalCount: number
    }>
  > {
    return this.presentSuccess({ empathy, totalCount }, message, 200)
  }

  static presentEmpathyRemoved(
    totalCount: number,
    message: string = '共感を削除しました'
  ): NextResponse<SuccessResponse<{ totalCount: number }>> {
    return this.presentSuccess({ totalCount }, message, 200)
  }

  static presentEmpathyStatus(
    hasEmpathized: boolean,
    empathyType: string | null,
    totalCount: number
  ): NextResponse<
    SuccessResponse<{
      hasEmpathized: boolean
      empathyType: string | null
      totalCount: number
    }>
  > {
    return this.presentSuccess({ hasEmpathized, empathyType, totalCount }, undefined, 200)
  }
}
