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

    it('3種類未満の文字種を含むパスワードを拒否する', () => {
      const result = validatePassword('password123') // 小文字と数字のみ
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'パスワードは小文字、大文字、数字、記号のうち3種類以上を含めてください'
      )
    })

    it('3種類以上の文字種を含むパスワードを受け入れる', () => {
      const result = validatePassword('SecurePass123') // 大文字、小文字、数字
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('よくあるパスワードを拒否する', () => {
      const result = validatePassword('password123')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('よくあるパスワードは使用できません')
    })

    it('よくあるパスワードでない場合は受け入れる', () => {
      const result = validatePassword('SecurePass123') // よくあるパスワードではない
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('ユーザー名を含むパスワードを拒否する', () => {
      const result = validatePassword('myusername123', { userName: 'myusername' })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('パスワードにユーザー名を含めることはできません')
    })

    it('メールアドレスの一部を含むパスワードを拒否する', () => {
      const result = validatePassword('testuser123', { email: 'testuser@example.com' })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('パスワードにメールアドレスの一部を含めることはできません')
    })

    it('大文字小文字を区別してユーザー名チェックを行う', () => {
      const result = validatePassword('MyUserName123', { userName: 'myusername' })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('パスワードにユーザー名を含めることはできません')
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

    it('3種類以上の文字種を含むパスワードはスコアが向上する', () => {
      const result = calculatePasswordStrength('SecurePass123')
      expect(result.score).toBeGreaterThan(1)
    })

    it('4種類の文字種を含むパスワードは最高スコアに近づく', () => {
      const result = calculatePasswordStrength('SecurePass123!')
      expect(result.score).toBeGreaterThanOrEqual(2)
    })

    it('よくあるパスワードはスコアが下がる', () => {
      const result = calculatePasswordStrength('password123')
      expect(result.score).toBeLessThan(2)
      expect(result.feedback).toContain('よくあるパスワードは避けてください')
    })

    it('文字種が不足している場合、改善のフィードバックを返す', () => {
      const result = calculatePasswordStrength('password123')
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

    it('3種類未満の文字種を含むパスワードを拒否する', () => {
      expect(() => passwordSchema.parse('password123')).toThrow()
    })

    it('よくあるパスワードを拒否する', () => {
      expect(() => passwordSchema.parse('Password123')).toThrow() // password123のバリエーション
    })
  })

  describe('createPasswordSchemaWithUserInfo', () => {
    it('ユーザー名を含むパスワードを拒否する', () => {
      const schema = createPasswordSchemaWithUserInfo('testuser')
      expect(() => schema.parse('testuser123')).toThrow()
    })

    it('メールアドレスの一部を含むパスワードを拒否する', () => {
      const schema = createPasswordSchemaWithUserInfo(undefined, 'testuser@example.com')
      expect(() => schema.parse('testuser123')).toThrow()
    })

    it('ユーザー名もメールアドレスも含まないパスワードを受け入れる', () => {
      const schema = createPasswordSchemaWithUserInfo('testuser', 'testuser@example.com')
      expect(() => schema.parse('SecurePass123!')).not.toThrow()
    })

    it('ユーザー名が未定義の場合でも動作する', () => {
      const schema = createPasswordSchemaWithUserInfo(undefined, 'test@example.com')
      expect(() => schema.parse('SecurePass123!')).not.toThrow()
    })

    it('メールアドレスが未定義の場合でも動作する', () => {
      const schema = createPasswordSchemaWithUserInfo('testuser')
      expect(() => schema.parse('SecurePass123!')).not.toThrow()
    })
  })
})
