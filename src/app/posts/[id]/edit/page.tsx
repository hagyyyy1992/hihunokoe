'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import PostForm from '@/components/forms/PostForm'
import { SkinType, CosmeticCategory, MoodTag, UsageSituation, ExperienceDetails } from '@/types'

interface Post {
  id: string
  title: string
  content: string
  cosmeticName: string
  cosmeticCategory?: CosmeticCategory
  skinType?: SkinType
  usageSituation?: {
    season?: string
    timeOfDay?: string
    menstrualCycle?: string
    skinCondition?: string
    weatherCondition?: string
  }
  experienceDetails?: {
    fragrance?: {
      type?: string
      intensity?: string
      description?: string
    }
    texture?: {
      type?: string
      spreadability?: string
      absorption?: string
      description?: string
    }
    afterUse?: {
      moisture?: string
      texture?: string
      comfort?: string
      duration?: string
      description?: string
    }
  }
  moodTag?: MoodTag
  user: {
    id: string
  }
}

export default function EditPostPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchPost = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '投稿の取得に失敗しました')
      }

      setPost(data.post)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '投稿の取得に失敗しました'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchPost()
    }
  }, [id, fetchPost])

  useEffect(() => {
    // ユーザーが認証されていない場合はログインページにリダイレクト
    if (!loading && !user) {
      router.push('/auth/login')
    }

    // 投稿が取得できて、ユーザーが投稿者でない場合は詳細ページにリダイレクト
    if (!loading && post && user && post.user.id !== user.id) {
      router.push(`/posts/${id}`)
    }
  }, [loading, post, user, router, id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">投稿が見つかりません</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return null
  }

  // PostFormに渡すためのデータを整形
  const formData = {
    title: post.title,
    content: post.content,
    cosmeticName: post.cosmeticName,
    cosmeticCategory: (post.cosmeticCategory as CosmeticCategory) || '',
    skinType: (post.skinType as SkinType) || '',
    usageSituation: (post.usageSituation || {}) as Partial<UsageSituation>,
    experienceDetails: (post.experienceDetails || {}) as Partial<ExperienceDetails>,
    moodTag: (post.moodTag as MoodTag) || '',
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">投稿を編集</h1>
          <p className="text-gray-600 mt-2">投稿内容を編集できます。</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
          <PostForm initialData={formData} postId={post.id} isEditMode={true} />
        </div>
      </div>
    </div>
  )
}
