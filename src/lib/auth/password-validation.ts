import { z } from 'zod'

// よくあるパスワードのブラックリスト
const COMMON_PASSWORDS = [
  'password',
  'password1',
  'password123',
  'password1234',
  'password12345',
  'password123456',
  'password1234567',
  'password12345678',
  'password123456789',
  '12345678',
  '123456789',
  '1234567890',
  '11111111',
  '00000000',
  'qwerty123',
  'abc12345',
  'admin123',
  'admin1234',
  'user1234',
  'test1234',
  'demo1234',
  'welcome123',
  'hello123',
  'letmein123',
  'monkey123',
  'dragon123',
  'sunshine123',
  'princess123',
  'football123',
  'iloveyou123',
]

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

  if (charTypes >= 3) score++
  if (charTypes === 4) score++

  if (charTypes < 3) {
    const missing = []
    if (!hasLower) missing.push('小文字')
    if (!hasUpper) missing.push('大文字')
    if (!hasNumber) missing.push('数字')
    if (!hasSpecial) missing.push('記号')

    feedback.push(`${missing.slice(0, 3 - charTypes).join('、')}を含めてください`)
  }

  // よくあるパスワードチェック
  if (COMMON_PASSWORDS.some(common => password.toLowerCase() === common.toLowerCase())) {
    score = Math.max(0, score - 2)
    feedback.push('よくあるパスワードは避けてください')
  }

  return { score, feedback }
}

// パスワードバリデーション関数
export function validatePassword(
  password: string,
  options?: {
    userName?: string
    email?: string
  }
): {
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

  // 文字種チェック（3種類以上）
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const charTypes = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length

  if (charTypes < 3) {
    errors.push('パスワードは小文字、大文字、数字、記号のうち3種類以上を含めてください')
  }

  // よくあるパスワードチェック
  if (COMMON_PASSWORDS.some(common => password.toLowerCase() === common.toLowerCase())) {
    errors.push('よくあるパスワードは使用できません')
  }

  // ユーザー情報との類似性チェック
  if (options?.userName && password.toLowerCase().includes(options.userName.toLowerCase())) {
    errors.push('パスワードにユーザー名を含めることはできません')
  }

  if (options?.email) {
    const emailLocal = options.email.split('@')[0]
    if (password.toLowerCase().includes(emailLocal.toLowerCase())) {
      errors.push('パスワードにメールアドレスの一部を含めることはできません')
    }
  }

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
    return charTypes >= 3
  }, 'パスワードは小文字、大文字、数字、記号のうち3種類以上を含めてください')
  .refine(
    password => !COMMON_PASSWORDS.some(common => password.toLowerCase() === common.toLowerCase()),
    'よくあるパスワードは使用できません'
  )

// ユーザー情報を含むパスワードバリデーション用のスキーマファクトリ
export function createPasswordSchemaWithUserInfo(userName?: string, email?: string) {
  let schema: z.ZodSchema<string> = passwordSchema

  if (userName) {
    schema = schema.refine(
      password => !password.toLowerCase().includes(userName.toLowerCase()),
      'パスワードにユーザー名を含めることはできません'
    )
  }

  if (email) {
    const emailLocal = email.split('@')[0]
    schema = schema.refine(
      password => !password.toLowerCase().includes(emailLocal.toLowerCase()),
      'パスワードにメールアドレスの一部を含めることはできません'
    )
  }

  return schema
}
