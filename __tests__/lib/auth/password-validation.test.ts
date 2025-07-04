import {
  validatePassword,
  calculatePasswordStrength,
  passwordSchema,
  createPasswordSchemaWithUserInfo,
} from '@/lib/auth/password-validation'

describe('password-validation', () => {
  describe('validatePassword', () => {
    it('8文字以上の有効なパスワードを受け入れる', () => {
      const result = validatePassword('Password123!')
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('8文字未満のパスワードを拒否する', () => {
      const result = validatePassword('Pass1!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('パスワードは8文字以上で入力してください')
    })

    it('128文字を超えるパスワードを拒否する', () => {
      const longPassword = 'a'.repeat(129)
      const result = validatePassword(longPassword)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('パスワードは128文字以下で入力してください')
    })

    it('2種類未満の文字種を含むパスワードを拒否する', () => {
      const result = validatePassword('password') // 小文字のみ
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'パスワードは小文字、大文字、数字、記号のうち2種類以上を含めてください'
      )
    })

    it('2種類以上の文字種を含むパスワードを受け入れる', () => {
      const result = validatePassword('password123') // 小文字と数字
      expect(result.isValid).toBe(true) // よくあるパスワードチェックが削除されたので受け入れられる
      expect(result.errors).toEqual([])
      const result2 = validatePassword('MySecure99') // 大文字、小文字、数字
      expect(result2.isValid).toBe(true)
      expect(result2.errors).toEqual([])
    })

    it('よくあるパスワードも受け入れるようになった', () => {
      const result = validatePassword('password123')
      expect(result.isValid).toBe(true) // よくあるパスワードチェックは削除された
      expect(result.errors).toEqual([])
    })

    it('ユーザー名を含むパスワードも受け入れるようになった', () => {
      const result = validatePassword('myusername123')
      expect(result.isValid).toBe(true) // ユーザー名チェックは削除された
      expect(result.errors).toEqual([])
    })

    it('メールアドレスの一部を含むパスワードも受け入れるようになった', () => {
      const result = validatePassword('testuser123')
      expect(result.isValid).toBe(true) // メールアドレスチェックは削除された
      expect(result.errors).toEqual([])
    })
  })

  describe('calculatePasswordStrength', () => {
    it('短いパスワードは低いスコアを返す', () => {
      const result = calculatePasswordStrength('abc')
      expect(result.score).toBe(0)
      expect(result.feedback).toContain('8文字以上にしてください')
    })

    it('8文字以上のパスワードはスコアが向上する', () => {
      const result = calculatePasswordStrength('abcdefgh')
      expect(result.score).toBeGreaterThan(0)
    })

    it('12文字以上のパスワードはさらにスコアが向上する', () => {
      const result1 = calculatePasswordStrength('SecurePass123')
      const result2 = calculatePasswordStrength('SecurePass1234')
      expect(result2.score).toBeGreaterThanOrEqual(result1.score)
    })

    it('2種類以上の文字種を含むパスワードはスコアが向上する', () => {
      const result = calculatePasswordStrength('SecurePass')
      expect(result.score).toBeGreaterThan(0)
    })

    it('4種類の文字種を含むパスワードは最高スコアに近づく', () => {
      const result = calculatePasswordStrength('SecurePass123!')
      expect(result.score).toBeGreaterThanOrEqual(2)
    })

    it('よくあるパスワードでもスコアが下がらなくなった', () => {
      const result = calculatePasswordStrength('password123')
      expect(result.score).toBeGreaterThan(0) // よくあるパスワードチェックが削除された
      expect(result.feedback).not.toContain('よくあるパスワードは避けてください')
    })

    it('文字種が不足している場合、改善のフィードバックを返す', () => {
      const result = calculatePasswordStrength('password') // 小文字のみ
      expect(result.feedback.some(f => f.includes('含めてください'))).toBe(true)
    })
  })

  describe('passwordSchema', () => {
    it('有効なパスワードを受け入れる', () => {
      expect(() => passwordSchema.parse('Password123!')).not.toThrow()
    })

    it('8文字未満のパスワードを拒否する', () => {
      expect(() => passwordSchema.parse('Pass1!')).toThrow()
    })

    it('128文字を超えるパスワードを拒否する', () => {
      const longPassword = 'a'.repeat(129)
      expect(() => passwordSchema.parse(longPassword)).toThrow()
    })

    it('2種類未満の文字種を含むパスワードを拒否する', () => {
      expect(() => passwordSchema.parse('password')).toThrow()
    })

    it('よくあるパスワードも受け入れるようになった', () => {
      expect(() => passwordSchema.parse('Password123')).not.toThrow() // よくあるパスワードチェックが削除された
    })
  })

  describe('createPasswordSchemaWithUserInfo', () => {
    it('ユーザー名を含むパスワードも受け入れるようになった', () => {
      const schema = createPasswordSchemaWithUserInfo()
      expect(() => schema.parse('testuser123')).not.toThrow() // ユーザー名チェックが削除された
    })

    it('メールアドレスの一部を含むパスワードも受け入れるようになった', () => {
      const schema = createPasswordSchemaWithUserInfo()
      expect(() => schema.parse('testuser123')).not.toThrow() // メールアドレスチェックが削除された
    })

    it('ユーザー名もメールアドレスも含まないパスワードを受け入れる', () => {
      const schema = createPasswordSchemaWithUserInfo()
      expect(() => schema.parse('SecurePass123!')).not.toThrow()
    })

    it('パラメータなしでも動作する', () => {
      const schema = createPasswordSchemaWithUserInfo()
      expect(() => schema.parse('SecurePass123!')).not.toThrow()
    })
  })
})
