'use client'

import { Comment } from '@/types'
import { useAuth } from '@/lib/auth/AuthContext'
import { useComments } from '@/hooks/useComments'
import CommentForm from './CommentForm'
import CommentItem from './CommentItem'
import { AuthGuard, LoginPrompt } from '@/components/auth/AuthGuard'

interface CommentListProps {
  postId: string
  initialCommentsCount?: number
}

export default function CommentList({ postId, initialCommentsCount = 0 }: CommentListProps) {
  const { user } = useAuth()
  const {
    comments,
    pagination,
    isLoading,
    error,
    addComment,
    updateComment,
    deleteComment,
    addReply,
    loadMore,
  } = useComments({ postId })

  const handleCommentSuccess = (comment: Comment) => {
    addComment(comment)
  }

  const handleReplySuccess = (parentCommentId: string) => (reply: Comment) => {
    addReply(parentCommentId, reply)
  }

  const handleEditSuccess = (updatedComment: Comment) => {
    updateComment(updatedComment.id, updatedComment)
  }

  const handleDeleteSuccess = (commentId: string) => {
    deleteComment(commentId)
  }

  const handleLoadMore = () => {
    if (!isLoading && pagination.hasMore) {
      loadMore()
    }
  }

  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        コメント ({pagination.total || initialCommentsCount})
      </h3>

      {/* コメント投稿フォーム */}
      <div className="mb-6">
        <AuthGuard fallback={<LoginPrompt message="コメントを投稿するにはログインが必要です" />}>
          <CommentForm postId={postId} onSuccess={handleCommentSuccess} />
        </AuthGuard>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* 初回読み込み中 */}
      {isLoading && comments.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          <span className="ml-2 text-gray-600">コメントを読み込み中...</span>
        </div>
      )}

      {/* コメント一覧 */}
      <div className="space-y-6">
        {comments.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            onReplySuccess={handleReplySuccess(comment.id)}
            onEditSuccess={handleEditSuccess}
            onDeleteSuccess={handleDeleteSuccess}
          />
        ))}
      </div>

      {/* もっと読み込むボタン */}
      {pagination.hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-6 py-2 text-sm font-medium text-pink-600 bg-pink-50 border border-pink-200 rounded-md hover:bg-pink-100 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                <span>読み込み中...</span>
              </div>
            ) : (
              'もっと見る'
            )}
          </button>
        </div>
      )}

      {/* コメントが0件の場合 */}
      {!isLoading && comments.length === 0 && (
        <div className="text-center py-8">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-gray-500 mb-2">まだコメントがありません</p>
          {user && <p className="text-sm text-gray-400">最初のコメントを投稿してみませんか？</p>}
        </div>
      )}
    </section>
  )
}
