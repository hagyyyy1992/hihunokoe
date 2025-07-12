import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  {
    ignores: ['src/generated/**/*'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  ...compat.extends('prettier'),
  {
    plugins: {
      prettier: (await import('eslint-plugin-prettier')).default,
      react: (await import('eslint-plugin-react')).default,
      'jsx-a11y': (await import('eslint-plugin-jsx-a11y')).default,
    },
    rules: {
      'prettier/prettier': 'error',
      // HTMLネスティングエラーを検知するルール
      'react/no-unescaped-entities': 'error',
      'jsx-a11y/no-redundant-roles': 'error',
      // カスタムルール：無効なHTMLネスティングを警告
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXElement[name.name="p"] JSXElement[name.name="div"]',
          message: '<div>は<p>要素の中に配置できません。ハイドレーションエラーの原因となります。',
        },
        {
          selector: 'JSXElement[name.name="select"] JSXElement[name.name="button"]',
          message:
            '<button>は<select>要素の中に配置できません。ハイドレーションエラーの原因となります。',
        },
      ],
    },
  },
]

export default eslintConfig
