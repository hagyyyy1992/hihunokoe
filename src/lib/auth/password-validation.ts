import { z } from 'zod'

// パスワード強度を計算
export function calculatePasswordStrength(password: string): {
  score: number // 0-4
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  // 長さチェック
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  else if (password.length < 8) {
    feedback.push('8文字以上にしてください')
  }

  // 文字種チェック
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const charTypes = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length

  if (charTypes >= 2) score++
  if (charTypes >= 3) score++
  if (charTypes === 4) score++

  if (charTypes < 2) {
    const missing = []
    if (!hasLower) missing.push('小文字')
    if (!hasUpper) missing.push('大文字')
    if (!hasNumber) missing.push('数字')
    if (!hasSpecial) missing.push('記号')

    feedback.push(`${missing.slice(0, 2 - charTypes).join('、')}を含めてください`)
  }

  // よくあるパスワードチェックは削除

  // Ensure score is within valid range (0-4)
  const clampedScore = Math.max(0, Math.min(4, score))

  return { score: clampedScore, feedback }
}

// パスワードバリデーション関数
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // 長さチェック（8-128文字）
  if (password.length < 8) {
    errors.push('パスワードは8文字以上で入力してください')
  }
  if (password.length > 128) {
    errors.push('パスワードは128文字以下で入力してください')
  }

  // 文字種チェック（2種類以上）
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const charTypes = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length

  if (charTypes < 2) {
    errors.push('パスワードは小文字、大文字、数字、記号のうち2種類以上を含めてください')
  }

  // よくあるパスワードチェックとユーザー情報との類似性チェックは削除

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Zodスキーマ用のカスタムバリデーション
export const passwordSchema = z
  .string()
  .min(8, 'パスワードは8文字以上で入力してください')
  .max(128, 'パスワードは128文字以下で入力してください')
  .refine(password => {
    const hasLower = /[a-z]/.test(password)
    const hasUpper = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const charTypes = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length
    return charTypes >= 2
  }, 'パスワードは小文字、大文字、数字、記号のうち2種類以上を含めてください')

// ユーザー情報を含むパスワードバリデーション用のスキーマファクトリ
// この関数は互換性のために残されていますが、ユーザー名やメールアドレスのチェックは削除されました
export function createPasswordSchemaWithUserInfo() {
  return passwordSchema
}
