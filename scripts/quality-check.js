#!/usr/bin/env node

/**
 * 品質チェック統合スクリプト
 * TypeScriptエラーを最優先で検出し、全てのチェックが通った場合のみ成功とする
 */

const { execSync } = require('child_process')
const chalk = require('chalk')

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
    name: 'ESLint',
    command: 'npm run lint',
    critical: true,
  },
  {
    name: 'テスト実行',
    command: 'npm test',
    critical: true,
  },
]

function runCommand(command, name) {
  try {
    console.log(chalk.blue(`🔄 ${name}を実行中...`))
    execSync(command, { stdio: 'inherit', cwd: process.cwd() })
    console.log(chalk.green(`✅ ${name}が完了しました`))
    return true
  } catch (error) {
    console.error(chalk.red(`❌ ${name}でエラーが発生しました`))
    console.error(chalk.red(`コマンド: ${command}`))
    console.error(chalk.red(`終了コード: ${error.status}`))
    return false
  }
}

function main() {
  console.log(chalk.yellow('🚀 品質チェックを開始します...\n'))

  const results = []
  let allPassed = true

  for (const check of checks) {
    const success = runCommand(check.command, check.name)
    results.push({ ...check, success })

    if (!success) {
      allPassed = false
      if (check.critical) {
        console.log(
          chalk.red(`\n💥 クリティカルチェック「${check.name}」が失敗しました。処理を中止します。`)
        )
        break
      }
    }
    console.log('') // 空行
  }

  // 結果サマリー
  console.log(chalk.yellow('📊 チェック結果サマリー:'))
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌'
    const color = result.success ? chalk.green : chalk.red
    console.log(`${icon} ${color(result.name)}`)
  })

  if (allPassed) {
    console.log(chalk.green('\n🎉 全ての品質チェックが完了しました！'))
    process.exit(0)
  } else {
    console.log(
      chalk.red('\n💥 品質チェックでエラーが発生しました。上記のエラーを修正してください。')
    )
    process.exit(1)
  }
}

main()
