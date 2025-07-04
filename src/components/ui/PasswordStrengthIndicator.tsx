'use client'

import React from 'react'
import { calculatePasswordStrength } from '@/lib/auth/password-validation'

interface PasswordStrengthIndicatorProps {
  password: string
  userName?: string
  email?: string
}

export function PasswordStrengthIndicator({
  password,
  userName,
  email,
}: PasswordStrengthIndicatorProps) {
  // Early return if password is empty
  if (!password) return null

  const { score, feedback } = calculatePasswordStrength(password)

  // 強度レベルの設定
  const strengthLevels = [
    { label: '弱い', color: 'bg-red-500', textColor: 'text-red-600' },
    { label: '改善が必要', color: 'bg-orange-500', textColor: 'text-orange-600' },
    { label: '普通', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
    { label: '強い', color: 'bg-green-500', textColor: 'text-green-600' },
    { label: 'とても強い', color: 'bg-green-600', textColor: 'text-green-700' },
  ]

  // Ensure score is within valid range (0-4)
  const clampedScore = Math.max(0, Math.min(4, Math.floor(score)))
  const currentLevel = strengthLevels[clampedScore] || strengthLevels[0]

  // ユーザー情報との類似性チェック
  const additionalFeedback: string[] = []
  if (userName && password.toLowerCase().includes(userName.toLowerCase())) {
    additionalFeedback.push('パスワードにユーザー名を含めないでください')
  }
  if (email) {
    const emailLocal = email.split('@')[0]
    if (password.toLowerCase().includes(emailLocal.toLowerCase())) {
      additionalFeedback.push('パスワードにメールアドレスの一部を含めないでください')
    }
  }

  const allFeedback = [...feedback, ...additionalFeedback]

  return (
    <div className="mt-2">
      {/* 強度バー */}
      <div className="flex gap-1 mb-2">
        {[0, 1, 2, 3, 4].map(level => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors ${
              level <= clampedScore ? currentLevel.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* 強度ラベル */}
      <div className="flex justify-between items-center">
        <span className={`text-sm font-medium ${currentLevel.textColor}`}>
          パスワード強度: {currentLevel.label}
        </span>
      </div>

      {/* フィードバック */}
      {allFeedback.length > 0 && (
        <ul className="mt-2 space-y-1">
          {allFeedback.map((item, index) => (
            <li key={index} className="text-xs text-gray-600 flex items-start">
              <span className="mr-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
