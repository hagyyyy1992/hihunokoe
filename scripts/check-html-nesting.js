#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const glob = require('glob')

// 無効なHTMLネスティングパターン
const INVALID_NESTING_PATTERNS = [
  {
    parent: /<p[^>]*>/gi,
    invalidChildren: [
      'div',
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'table',
      'form',
    ],
    message: '<p>要素の中に%sを配置することはできません',
  },
  {
    parent: /<select[^>]*>/gi,
    invalidChildren: ['button', 'a', 'input', 'select', 'textarea'],
    message: '<select>要素の中に%sを配置することはできません',
  },
  {
    parent: /<button[^>]*>/gi,
    invalidChildren: ['button', 'a', 'input', 'select', 'textarea', 'form'],
    message: '<button>要素の中に%sを配置することはできません',
  },
  {
    parent: /<a[^>]*>/gi,
    invalidChildren: ['a', 'button'],
    message: '<a>要素の中に%sを配置することはできません',
  },
]

// コンポーネントマッピング（UIコンポーネントが実際にレンダリングするHTML要素）
const COMPONENT_MAPPING = {
  CardDescription: 'p',
  Button: 'button',
  Link: 'a',
  Select: 'select',
  SelectTrigger: 'button',
  Input: 'input',
  Textarea: 'textarea',
}

// ファイルをチェックする関数
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const errors = []

  // JSX/TSXファイルの簡易パーサー
  const lines = content.split('\n')
  const componentStack = []

  lines.forEach((line, lineNum) => {
    // 開始タグを検出
    const openTagMatch = line.match(/<([A-Za-z][A-Za-z0-9]*)[^>]*>/)
    if (openTagMatch) {
      const tagName = openTagMatch[1]
      const htmlTag = COMPONENT_MAPPING[tagName] || tagName.toLowerCase()

      // スタックの親要素をチェック
      if (componentStack.length > 0) {
        const parent = componentStack[componentStack.length - 1]

        INVALID_NESTING_PATTERNS.forEach(pattern => {
          if (parent.htmlTag.match(pattern.parent)) {
            if (pattern.invalidChildren.includes(htmlTag)) {
              errors.push({
                file: filePath,
                line: lineNum + 1,
                message: pattern.message.replace('%s', `<${htmlTag}>`),
                code: line.trim(),
              })
            }
          }
        })
      }

      // 自己終了タグでない場合はスタックに追加
      if (!line.includes('/>')) {
        componentStack.push({ tagName, htmlTag, line: lineNum + 1 })
      }
    }

    // 終了タグを検出
    const closeTagMatch = line.match(/<\/([A-Za-z][A-Za-z0-9]*)>/)
    if (closeTagMatch) {
      const tagName = closeTagMatch[1]
      // スタックから対応する開始タグを削除
      for (let i = componentStack.length - 1; i >= 0; i--) {
        if (componentStack[i].tagName === tagName) {
          componentStack.splice(i, 1)
          break
        }
      }
    }
  })

  return errors
}

// メイン処理
function main() {
  console.log('🔍 HTMLネスティングチェックを開始します...\n')

  const files = glob.sync('src/**/*.{tsx,jsx}', {
    ignore: ['node_modules/**', 'src/generated/**'],
  })

  let totalErrors = 0
  const allErrors = []

  files.forEach(file => {
    const errors = checkFile(file)
    if (errors.length > 0) {
      allErrors.push(...errors)
      totalErrors += errors.length
    }
  })

  if (totalErrors > 0) {
    console.error('❌ HTMLネスティングエラーが見つかりました:\n')
    allErrors.forEach(error => {
      console.error(`${error.file}:${error.line}`)
      console.error(`  ${error.message}`)
      console.error(`  > ${error.code}\n`)
    })
    console.error(`\n合計 ${totalErrors} 個のエラーが見つかりました。`)
    process.exit(1)
  } else {
    console.log('✅ HTMLネスティングエラーは見つかりませんでした。')
  }
}

// スクリプトを実行
if (require.main === module) {
  main()
}

module.exports = { checkFile, INVALID_NESTING_PATTERNS }
