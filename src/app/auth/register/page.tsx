'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SkinType, Gender, AllergyType } from '@prisma/client'
import { Input } from '@/components/ui/Input'
import { PasswordStrengthIndicator } from '@/components/ui/PasswordStrengthIndicator'
import { PasswordRequirements } from '@/components/ui/PasswordRequirements'
import { DatePicker } from '@/components/ui/DatePicker'

// 定数として外に出して再作成を防ぐ
const SKIN_TYPE_OPTIONS = [
  { value: '', label: '選択してください' },
  { value: 'normal', label: '普通肌' },
  { value: 'dry', label: '乾燥肌' },
  { value: 'oily', label: '脂性肌' },
  { value: 'combination', label: '混合肌' },
  { value: 'sensitive', label: '敏感肌' },
  { value: 'other', label: 'その他' },
] as const

const GENDER_OPTIONS = [
  { value: '', label: '選択してください' },
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
] as const

const ALLERGY_OPTIONS = [
  { value: 'fragrance', label: '香料' },
  { value: 'alcohol', label: 'アルコール' },
  { value: 'paraben', label: 'パラベン' },
  { value: 'sulfate', label: '硫酸塩' },
  { value: 'silicone', label: 'シリコン' },
  { value: 'mineral_oil', label: 'ミネラルオイル' },
  { value: 'formaldehyde', label: 'ホルムアルデヒド' },
  { value: 'latex', label: 'ラテックス' },
  { value: 'nickel', label: 'ニッケル' },
  { value: 'other', label: 'その他' },
] as const

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: '2000-01-01',
    gender: '' as Gender | '',
    skinType: '' as SkinType | '',
    skinTypeOther: '',
    allergies: [] as AllergyType[],
    allergiesOther: '',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません')
      setFieldErrors({ confirmPassword: 'パスワードが一致しません' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (formData.password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      setFieldErrors({ password: 'パスワードは8文字以上で入力してください' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setLoading(true)

    try {
      // 直接API呼び出しに変更（AuthContextのregisterを使用しない）
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: formData.userName,
          email: formData.email,
          password: formData.password,
          birthDate: formData.birthDate || undefined,
          gender: formData.gender || undefined,
          skinType: formData.skinType || undefined,
          skinTypeOther: formData.skinTypeOther || undefined,
          allergies: formData.allergies.length > 0 ? formData.allergies : undefined,
          allergiesOther: formData.allergiesOther || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Cookie設定は同期的に処理されるため遅延不要

        // 登録完了画面にリダイレクト
        router.push(`/auth/registration-complete?email=${encodeURIComponent(formData.email)}`)
      } else {
        // APIからの詳細なエラーメッセージを表示
        let errorMessage = data.error || 'ユーザー登録に失敗しました'

        // フィールド固有のエラーをセット
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors)
        }

        // より詳細なエラーメッセージを構築
        if (data.message) {
          errorMessage = data.message
        }

        setError(errorMessage)
        // エラー時に画面上部にスクロール
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (err: unknown) {
      console.error('Registration error:', err)
      setError('サーバーへの接続に失敗しました。しばらく待ってから再度お試しください。')
      // エラー時に画面上部にスクロール
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'allergies') {
      // Handle multiple select for allergies
      const selectElement = e.target as HTMLSelectElement
      const selectedValues = Array.from(
        selectElement.selectedOptions,
        option => option.value as AllergyType
      )
      setFormData(prev => ({
        ...prev,
        allergies: selectedValues,
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }))
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-apple-100 rounded-full flex items-center justify-center">
            <span className="text-apple-600 font-bold text-lg">H</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">会員登録</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          既にアカウントをお持ちの方は{' '}
          <Link href="/auth/login" className="font-medium text-apple-600 hover:text-apple-500">
            ログイン
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} data-testid="register-form">
            {error && (
              <div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md"
                data-testid="error-message"
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700">
                ユーザー名 *
              </label>
              <div className="mt-1">
                <input
                  id="userName"
                  name="userName"
                  type="text"
                  required
                  value={formData.userName}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-apple-500 focus:border-apple-500 sm:text-sm ${
                    fieldErrors.userName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="ユーザー名を入力してください"
                  data-testid="username-input"
                />
              </div>
              {fieldErrors.userName && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.userName}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">3〜50文字で入力してください</p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス *
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-apple-500 focus:border-apple-500 sm:text-sm ${
                    fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="example@example.com"
                  data-testid="email-input"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
                生年月日
              </label>
              <div className="mt-1">
                <DatePicker
                  id="birthDate"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={value => setFormData({ ...formData, birthDate: value })}
                  maxDate={new Date()}
                  placeholder="生年月日を選択"
                  data-testid="birth-date-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                性別
              </label>
              <div className="mt-1">
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-apple-500 focus:border-apple-500 sm:text-sm"
                  data-testid="gender-select"
                >
                  {GENDER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="skinType" className="block text-sm font-medium text-gray-700">
                肌質
              </label>
              <div className="mt-1">
                <select
                  id="skinType"
                  name="skinType"
                  value={formData.skinType}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-apple-500 focus:border-apple-500 sm:text-sm"
                  data-testid="skin-type-select"
                >
                  {SKIN_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {formData.skinType === 'other' && (
                <div className="mt-2">
                  <input
                    name="skinTypeOther"
                    type="text"
                    value={formData.skinTypeOther}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-apple-500 focus:border-apple-500 sm:text-sm"
                    placeholder="その他の肌質を入力してください"
                    data-testid="skin-type-other-input"
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">
                アレルギー（複数選択可）
              </label>
              <div className="mt-1">
                <select
                  id="allergies"
                  name="allergies"
                  multiple
                  value={formData.allergies}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-apple-500 focus:border-apple-500 sm:text-sm"
                  size={5}
                  data-testid="allergies-select"
                >
                  {ALLERGY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Ctrl/Cmdキーを押しながらクリックで複数選択
              </p>
              {formData.allergies.includes('other' as AllergyType) && (
                <div className="mt-2">
                  <input
                    name="allergiesOther"
                    type="text"
                    value={formData.allergiesOther}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-apple-500 focus:border-apple-500 sm:text-sm"
                    placeholder="その他のアレルギーを入力してください"
                    data-testid="allergies-other-input"
                  />
                </div>
              )}
            </div>

            <div>
              <Input
                label="パスワード"
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="パスワードを入力してください"
                data-testid="password-input"
                error={fieldErrors.password}
              />
              <PasswordStrengthIndicator
                password={formData.password}
                userName={formData.userName}
                email={formData.email}
              />
              <PasswordRequirements password={formData.password} />
            </div>

            <Input
              label="パスワード確認"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="パスワードを再度入力してください"
              data-testid="confirm-password-input"
              error={fieldErrors.confirmPassword}
            />

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-apple-600 hover:bg-apple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-apple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="register-button"
              >
                {loading ? '登録中...' : '会員登録'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
