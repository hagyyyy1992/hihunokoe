'use client'

import { Button } from '@/components/ui/Button'
import { useEffect, useCallback } from 'react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  variant?: 'danger' | 'warning' | 'default'
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = '確認',
  cancelText = 'キャンセル',
  onConfirm,
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  // Escキーで閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !loading) {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onOpenChange, loading])

  // 確認ボタンのハンドラー
  const handleConfirm = useCallback(async () => {
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      // エラーハンドリングは呼び出し側で行う
      console.error('Confirm action failed:', error)
    }
  }, [onConfirm, onOpenChange])

  if (!open) return null

  const variantStyles = {
    danger: {
      confirmButton: 'danger',
      icon: '⚠️',
    },
    warning: {
      confirmButton: 'primary',
      icon: '⚠️',
    },
    default: {
      confirmButton: 'primary',
      icon: 'ℹ️',
    },
  } as const

  const styles = variantStyles[variant]

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        onClick={() => !loading && onOpenChange(false)}
        aria-label="ダイアログを閉じる"
      >
        {/* ダイアログ本体 */}
        <div
          className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 shadow-lg"
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby={description ? 'dialog-description' : undefined}
        >
          {/* タイトル */}
          <h3
            id="dialog-title"
            className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center gap-2"
          >
            {variant !== 'default' && <span className="text-xl">{styles.icon}</span>}
            {title}
          </h3>

          {/* 説明文 */}
          {description && (
            <p id="dialog-description" className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              {description}
            </p>
          )}

          {/* ボタン */}
          <div className="flex justify-end space-x-2 sm:space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              variant={styles.confirmButton}
              onClick={handleConfirm}
              loading={loading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

// 削除確認専用のラッパーコンポーネント
interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  itemName?: string
  loading?: boolean
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName = 'この項目',
  loading = false,
}: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${itemName}を削除しますか？`}
      description="この操作は取り消すことができません。本当に削除してもよろしいですか？"
      confirmText={loading ? '削除中...' : '削除する'}
      cancelText="キャンセル"
      onConfirm={onConfirm}
      variant="danger"
      loading={loading}
    />
  )
}
