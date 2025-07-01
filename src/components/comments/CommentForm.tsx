'use client'

import { useState } from 'react'
import { CommentFormData, Comment } from '@/types'

interface CommentFormProps {
  postId: string
  parentCommentId?: string
  onSuccess?: (comment: Comment) => void
  onCancel?: () => void
  placeholder?: string
  isReply?: boolean
  isSubmitting?: boolean
}

export default function CommentForm({
  postId,
  parentCommentId,
  onSuccess,
  onCancel,
  placeholder = 'コメントを書く...',
  isReply = false,
  isSubmitting = false,
}: CommentFormProps) {
  const [formData, setFormData] = useState<CommentFormData>({
    content: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [charCount, setCharCount] = useState(0)

  const maxLength = 1000

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= maxLength) {
      setFormData({ content: value })
      setCharCount(value.length)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.content.trim()) {
      setError('コメント内容を入力してください')
      return
    }

    if (formData.content.length > maxLength) {
      setError(`コメントは${maxLength}文字以内で入力してください`)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const url = parentCommentId
        ? `/api/comments/${parentCommentId}/reply`
        : `/api/posts/${postId}/comments`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'コメントの投稿に失敗しました')
      }

      // フォームをリセット
      setFormData({ content: '' })
      setCharCount(0)

      // 成功コールバック
      if (onSuccess) {
        onSuccess(data.comment)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'コメントの投稿に失敗しました'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({ content: '' })
    setCharCount(0)
    setError('')
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          value={formData.content}
          onChange={handleContentChange}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-md shadow-sm resize-none focus:outline-none focus:ring-pink-500 focus:border-pink-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${isReply ? 'text-sm' : ''}`}
          rows={isReply ? 2 : 3}
          disabled={isLoading || isSubmitting}
          style={{
            minHeight: isReply ? '64px' : '76px',
            maxHeight: '200px',
            resize: 'vertical',
          }}
        />
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {charCount}/{maxLength}
        </div>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</div>}

      <div className={`flex ${isReply ? 'justify-end' : 'justify-between'} items-center`}>
        {!isReply && (
          <div className="text-xs text-gray-500">
            <span className="mr-4">Shift + Enter で改行</span>
            <span>Enter で投稿</span>
          </div>
        )}

        <div className="flex items-center space-x-2">
          {isReply && onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading || isSubmitting}
              className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || isSubmitting || !formData.content.trim()}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 ${
              isReply ? 'bg-gray-600 hover:bg-gray-700' : 'bg-pink-600 hover:bg-pink-700'
            }`}
          >
            {isLoading || isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>投稿中...</span>
              </div>
            ) : isReply ? (
              '返信'
            ) : (
              'コメントする'
            )}
          </button>
        </div>
      </div>
    </form>
  )
}

// キーボードショートカット用のヘルパーコンポーネント
export function CommentFormWithShortcuts(props: CommentFormProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.querySelector('form')
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
      }
    }
  }

  return (
    <div onKeyDown={handleKeyDown}>
      <CommentForm {...props} />
    </div>
  )
}
