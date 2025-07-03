import React from 'react'

interface PasswordRequirementsProps {
  password?: string
  showAll?: boolean
}

export function PasswordRequirements({
  password = '',
  showAll = false,
}: PasswordRequirementsProps) {
  const requirements = [
    {
      label: '8文字以上128文字以下',
      met: password.length >= 8 && password.length <= 128,
    },
    {
      label: '小文字、大文字、数字、記号のうち2種類以上を含む',
      met: (() => {
        const hasLower = /[a-z]/.test(password)
        const hasUpper = /[A-Z]/.test(password)
        const hasNumber = /[0-9]/.test(password)
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
        return [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length >= 2
      })(),
    },
  ]

  // パスワードが入力されていない場合、またはshowAllがtrueの場合は全要件を表示
  const displayRequirements =
    showAll || password.length === 0 ? requirements : requirements.filter(req => !req.met)

  if (displayRequirements.length === 0 && !showAll) return null

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-md">
      <p className="text-xs font-medium text-gray-700 mb-2">パスワード要件:</p>
      <ul className="space-y-1">
        {displayRequirements.map((req, index) => (
          <li
            key={index}
            className={`text-xs flex items-start ${
              password.length > 0 && req.met ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <span className="mr-1 mt-0.5">{password.length > 0 && req.met ? '✓' : '•'}</span>
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
