'use client'

import { useState, useCallback, useEffect } from 'react'
import { EmpathyType } from '@/types'

interface EmpathyButtonProps {
  postId: string
  initialCount: number
  initialHasEmpathized?: boolean
  initialEmpathyType?: EmpathyType
  className?: string
  size?: 'sm' | 'md' | 'lg'
  initializing?: boolean
}

export default function EmpathyButton({
  postId,
  initialCount,
  initialHasEmpathized = false,
  initialEmpathyType,
  className = '',
  size = 'md',
  initializing = false,
}: EmpathyButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [hasEmpathized, setHasEmpathized] = useState(initialHasEmpathized)
  const [empathyType, setEmpathyType] = useState<EmpathyType | undefined>(initialEmpathyType)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // propsの変更を監視して内部状態を更新
  useEffect(() => {
    setCount(initialCount)
    setHasEmpathized(initialHasEmpathized)
    setEmpathyType(initialEmpathyType)
  }, [initialCount, initialHasEmpathized, initialEmpathyType])

  const handleEmpathy = useCallback(async () => {
    if (isLoading || initializing) return

    setIsLoading(true)
    setError('')

    try {
      if (hasEmpathized) {
        // 共感を削除
        const response = await fetch(`/api/posts/empathy?id=${postId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || '共感の削除に失敗しました')
        }

        const data = await response.json()

        // 楽観的UI更新
        setHasEmpathized(false)
        setEmpathyType(undefined)
        setCount(data.totalCount)
      } else {
        // 共感を追加
        const response = await fetch(`/api/posts/empathy?id=${postId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            empathyType: 'helpful', // デフォルトは「参考になった」
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || '共感の追加に失敗しました')
        }

        const data = await response.json()

        // 楽観的UI更新
        setHasEmpathized(true)
        setEmpathyType(data.empathy.empathyType)
        setCount(data.totalCount)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '操作に失敗しました'
      setError(errorMessage)

      // エラー時は楽観的UI更新を戻す
      // 特定のエラーの場合は適切な状態に設定
      if (errorMessage.includes('既に共感済み')) {
        // すでに共感済みの場合は共感ありの状態に設定
        setHasEmpathized(true)
        setEmpathyType('HELPFUL') // デフォルトタイプ
        // カウントはサーバーの現在の値を維持（変更しない）
      } else if (errorMessage.includes('共感が見つかりません')) {
        // 共感が見つからない場合は共感なしの状態に設定
        setHasEmpathized(false)
        setEmpathyType(undefined)
        // カウントはサーバーの現在の値を維持（変更しない）
      } else {
        // その他のエラーの場合は元の状態に戻す
        if (hasEmpathized) {
          setHasEmpathized(true)
          setEmpathyType(empathyType)
          setCount(prevCount => prevCount + 1)
        } else {
          setHasEmpathized(false)
          setEmpathyType(undefined)
          setCount(prevCount => Math.max(0, prevCount - 1))
        }
      }

      // エラーメッセージを3秒後に消す
      setTimeout(() => setError(''), 3000)
    } finally {
      setIsLoading(false)
    }
  }, [hasEmpathized, isLoading, postId, empathyType, initializing])

  // サイズに応じたスタイル
  const sizeClasses = {
    sm: {
      button: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      text: 'text-xs',
    },
    md: {
      button: 'px-4 py-2 text-sm',
      icon: 'w-4 h-4',
      text: 'text-sm',
    },
    lg: {
      button: 'px-6 py-3 text-base',
      icon: 'w-5 h-5',
      text: 'text-base',
    },
  }

  const currentSize = sizeClasses[size]

  // ボタンのスタイル
  const buttonClasses = `
    flex items-center space-x-2 font-medium rounded-md transition-all duration-200 
    disabled:opacity-50 disabled:cursor-not-allowed
    ${currentSize.button}
    ${
      hasEmpathized
        ? 'text-white bg-pink-600 hover:bg-pink-700 focus:ring-pink-500'
        : 'text-pink-600 bg-pink-50 hover:bg-pink-100 focus:ring-pink-500 border border-pink-200'
    }
    focus:outline-none focus:ring-2 focus:ring-offset-2
    ${isLoading ? 'cursor-wait' : 'cursor-pointer'}
    ${className}
  `.trim()

  // ハートアイコンのアニメーション
  const heartClasses = `
    ${currentSize.icon} transition-transform duration-200
    ${isLoading ? 'animate-pulse' : ''}
    ${hasEmpathized ? 'scale-110' : 'hover:scale-105'}
  `.trim()

  return (
    <div className="relative">
      <button
        onClick={handleEmpathy}
        disabled={isLoading || initializing}
        className={buttonClasses}
        aria-label={hasEmpathized ? '共感を取り消す' : '共感する'}
        data-testid="empathy-button"
      >
        {/* ハートアイコン */}
        <svg
          className={heartClasses}
          fill={hasEmpathized ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={hasEmpathized ? 0 : 2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>

        {/* テキストと数値 */}
        <span className={currentSize.text}>
          {size === 'sm' ? count : `${hasEmpathized ? '共感済み' : '共感する'} (${count})`}
        </span>

        {/* ローディングインジケーター */}
        {(isLoading || initializing) && (
          <div
            className={`${currentSize.icon} animate-spin rounded-full border-2 border-current border-t-transparent`}
          />
        )}
      </button>

      {/* エラーメッセージ */}
      {error && (
        <div className="absolute top-full left-0 mt-1 p-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md shadow-sm whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  )
}
