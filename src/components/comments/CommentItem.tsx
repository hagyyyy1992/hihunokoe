'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Comment } from '@/types'
import { useAuth } from '@/lib/auth/AuthContext'
import CommentForm from './CommentForm'
import { DeleteConfirmDialog } from '@/components/ui/ConfirmDialog'

interface CommentItemProps {
  comment: Comment
  postId: string
  isReply?: boolean
  onReplySuccess?: (reply: Comment) => void
  onEditSuccess?: (updatedComment: Comment) => void
  onDeleteSuccess?: (commentId: string) => void
}

const skinTypeLabels: Record<string, string> = {
  normal: '普通肌',
  dry: '乾燥肌',
  oily: '脂性肌',
  combination: '混合肌',
  sensitive: '敏感肌',
}

export default function CommentItem({
  comment,
  postId,
  isReply = false,
  onReplySuccess,
  onEditSuccess,
  onDeleteSuccess,
}: CommentItemProps) {
  const { user } = useAuth()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState('')

  const canEdit = user && user.id === comment.user.id
  const canDelete = user && user.id === comment.user.id
  const canReply = user && !isReply // 返信への返信は不可

  const handleReplySuccess = (reply: Comment) => {
    setShowReplyForm(false)
    if (onReplySuccess) {
      onReplySuccess(reply)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editContent.trim()) {
      setError('コメント内容を入力してください')
      return
    }

    if (editContent.length > 1000) {
      setError('コメントは1000文字以内で入力してください')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/comments/edit?id=${comment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editContent }),
        credentials: 'same-origin',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'コメントの編集に失敗しました')
      }

      setIsEditing(false)
      if (onEditSuccess) {
        // APIから返信データがない場合は、既存の返信を保持
        const updatedComment = {
          ...data.comment,
          replies: data.comment.replies || comment.replies || [],
        }
        onEditSuccess(updatedComment)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'コメントの編集に失敗しました'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setEditContent(comment.content)
    setError('')
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/comments/edit?id=${comment.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'コメントの削除に失敗しました')
      }

      setShowDeleteConfirm(false)
      if (onDeleteSuccess) {
        onDeleteSuccess(comment.id)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'コメントの削除に失敗しました'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`${isReply ? 'ml-8 mt-3' : ''}`} data-testid="comment">
      <div className="flex items-start space-x-3">
        <div
          className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'} bg-apple-100 rounded-full flex items-center justify-center flex-shrink-0`}
        >
          <span className={`text-apple-600 font-medium ${isReply ? 'text-xs' : 'text-sm'}`}>
            {comment.user.userName.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`font-medium text-gray-900 ${isReply ? 'text-sm' : ''}`}>
              {comment.user.userName}
            </span>
            {comment.user.skinType && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {skinTypeLabels[comment.user.skinType]}
              </span>
            )}
            <time className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
                locale: ja,
              })}
            </time>
            {comment.isEdited && <span className="text-xs text-gray-400">編集済み</span>}
          </div>

          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-2">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-apple-500 focus:border-apple-500"
                rows={3}
                disabled={isSubmitting}
              />
              {error && <div className="text-sm text-red-600">{error}</div>}
              <div className="flex items-center space-x-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !editContent.trim()}
                  className="px-3 py-1 text-sm font-medium text-white bg-apple-600 rounded-md hover:bg-apple-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? '保存中...' : '保存'}
                </button>
                <button
                  type="button"
                  onClick={handleEditCancel}
                  disabled={isSubmitting}
                  className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          ) : (
            <>
              <p
                className={`text-gray-700 leading-relaxed ${isReply ? 'text-sm' : ''} comment-content`}
              >
                {comment.content}
              </p>

              <div className="flex items-center space-x-4 mt-2">
                {canReply && (
                  <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="text-xs text-gray-500 hover:text-apple-600 transition-colors"
                  >
                    返信
                  </button>
                )}
                {canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-gray-500 hover:text-apple-600 transition-colors"
                  >
                    編集
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                  >
                    削除
                  </button>
                )}
              </div>
            </>
          )}

          {showReplyForm && canReply && (
            <div className="mt-3">
              <CommentForm
                postId={postId}
                parentCommentId={comment.id}
                onSuccess={handleReplySuccess}
                onCancel={() => setShowReplyForm(false)}
                placeholder={`@${comment.user.userName} への返信...`}
                isReply={true}
              />
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  isReply={true}
                  onEditSuccess={onEditSuccess}
                  onDeleteSuccess={onDeleteSuccess}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        itemName="コメント"
        loading={isSubmitting}
      />
    </div>
  )
}
