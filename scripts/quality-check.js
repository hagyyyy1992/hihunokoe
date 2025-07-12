#!/usr/bin/env node

/**
 * 品質チェック統合スクリプト
 * TypeScriptエラーを最優先で検出し、全てのチェックが通った場合のみ成功とする
 */

const { execSync } = require('child_process')

// 色付きコンソール出力のヘルパー関数
const colors = {
  red: text => `\x1b[31m${text}\x1b[0m`,
  green: text => `\x1b[32m${text}\x1b[0m`,
  yellow: text => `\x1b[33m${text}\x1b[0m`,
  blue: text => `\x1b[34m${text}\x1b[0m`,
}

const checks = [
  {
    name: 'TypeScript型チェック',
    command: 'npx tsc --noEmit',
    critical: true, // 失敗したら即座に中止
  },
  {
    name: 'コードフォーマット',
    command: 'npm run format',
    critical: false,
  },
  {
    name: 'Prismaスキーマフォーマット',
    command: 'npx prisma format',
    critical: false,
  },
  {
    name: 'HTMLネスティングチェック',
    command: 'node scripts/check-html-nesting.js',
    critical: true, // ハイドレーションエラーを防ぐため重要
  },
  {
    name: 'ESLint',
    command: 'npm run lint',
    critical: true,
  },
  {
    name: 'テスト実行',
    command: 'npm test',
    critical: true,
  },
  {
    name: 'ビルドチェック（Next.js SSG/SSR検証）',
    command: 'npm run build:check',
    critical: false, // 開発環境でのGraphQL問題により非クリティカルに変更
  },
]

function runCommand(command, name) {
  try {
    console.log(colors.blue(`🔄 ${name}を実行中...`))
    execSync(command, { stdio: 'inherit', cwd: process.cwd() })
    console.log(colors.green(`✅ ${name}が完了しました`))
    return true
  } catch (error) {
    console.error(colors.red(`❌ ${name}でエラーが発生しました`))
    console.error(colors.red(`コマンド: ${command}`))
    console.error(colors.red(`終了コード: ${error.status}`))
    return false
  }
}

function main() {
  console.log(colors.yellow('🚀 品質チェックを開始します...\n'))

  const results = []
  let allPassed = true

  for (const check of checks) {
    const success = runCommand(check.command, check.name)
    results.push({ ...check, success })

    if (!success) {
      allPassed = false
      if (check.critical) {
        console.log(
          colors.red(`\n💥 クリティカルチェック「${check.name}」が失敗しました。処理を中止します。`)
        )
        break
      }
    }
    console.log('') // 空行
  }

  // 結果サマリー
  console.log(colors.yellow('📊 チェック結果サマリー:'))
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌'
    const color = result.success ? colors.green : colors.red
    console.log(`${icon} ${color(result.name)}`)
  })

  if (allPassed) {
    console.log(colors.green('\n🎉 全ての品質チェックが完了しました！'))
    process.exit(0)
  } else {
    console.log(
      colors.red('\n💥 品質チェックでエラーが発生しました。上記のエラーを修正してください。')
    )
    process.exit(1)
  }
}

main()
