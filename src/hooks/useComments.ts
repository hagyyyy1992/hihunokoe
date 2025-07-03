'use client'

import { useState, useCallback, useEffect } from 'react'
import { Comment, CommentsPagination } from '@/types'

interface UseCommentsOptions {
  postId: string
  initialPage?: number
  initialLimit?: number
}

interface UseCommentsReturn {
  comments: Comment[]
  pagination: CommentsPagination
  isLoading: boolean
  error: string
  fetchComments: (page?: number) => Promise<void>
  addComment: (comment: Comment) => void
  updateComment: (commentId: string, updatedComment: Comment) => void
  deleteComment: (commentId: string) => void
  addReply: (parentCommentId: string, reply: Comment) => void
  refreshComments: () => Promise<void>
  loadMore: () => Promise<void>
}

export function useComments({
  postId,
  initialPage = 1,
  initialLimit = 10,
}: UseCommentsOptions): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([])
  const [pagination, setPagination] = useState<CommentsPagination>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    hasMore: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchComments = useCallback(
    async (page = 1) => {
      setIsLoading(true)
      setError('')

      try {
        const searchParams = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
        })

        const response = await fetch(`/apis/posts/comments?id=${postId}&${searchParams}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'コメントの取得に失敗しました')
        }

        if (page === 1) {
          setComments(data.comments)
        } else {
          setComments(prev => [...prev, ...data.comments])
        }

        setPagination(data.pagination)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'コメントの取得に失敗しました'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [postId, pagination.limit]
  )

  const refreshComments = useCallback(() => {
    return fetchComments(1)
  }, [fetchComments])

  const loadMore = useCallback(() => {
    if (pagination.hasMore && !isLoading) {
      return fetchComments(pagination.page + 1)
    }
    return Promise.resolve()
  }, [fetchComments, pagination.hasMore, pagination.page, isLoading])

  const addComment = useCallback((comment: Comment) => {
    setComments(prev => [comment, ...prev])
    setPagination(prev => ({
      ...prev,
      total: prev.total + 1,
    }))
  }, [])

  const updateComment = useCallback((commentId: string, updatedComment: Comment) => {
    setComments(prev =>
      prev.map(comment => {
        if (comment.id === commentId) {
          return updatedComment
        }

        // 返信の中を検索して更新
        if (comment.replies) {
          const updatedReplies = comment.replies.map(reply =>
            reply.id === commentId ? updatedComment : reply
          )
          return { ...comment, replies: updatedReplies }
        }

        return comment
      })
    )
  }, [])

  const deleteComment = useCallback((commentId: string) => {
    setComments(prev => {
      const filtered = prev.filter(comment => {
        if (comment.id === commentId) {
          return false
        }

        // 返信の中から削除
        if (comment.replies) {
          comment.replies = comment.replies.filter(reply => reply.id !== commentId)
        }

        return true
      })

      return filtered
    })

    setPagination(prev => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
    }))
  }, [])

  const addReply = useCallback((parentCommentId: string, reply: Comment) => {
    setComments(prev =>
      prev.map(comment => {
        if (comment.id === parentCommentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply],
          }
        }
        return comment
      })
    )
  }, [])

  // 初回読み込み
  useEffect(() => {
    if (postId) {
      fetchComments(1)
    }
  }, [postId, fetchComments])

  return {
    comments,
    pagination,
    isLoading,
    error,
    fetchComments,
    addComment,
    updateComment,
    deleteComment,
    addReply,
    refreshComments,
    loadMore,
  }
}
