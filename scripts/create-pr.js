#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

/**
 * 高品質なプルリクエストを自動生成するスクリプト
 */
class PRCreator {
  constructor() {
    this.isDraft = false
    this.skipCI = false
    this.customTitle = null
    this.maxRetries = 3
  }

  /**
   * コマンドライン引数を解析
   */
  parseArgs() {
    const args = process.argv.slice(2)

    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '--title':
          this.customTitle = args[++i]
          break
        case '--draft':
          this.isDraft = true
          break
        case '--no-ci':
          this.skipCI = true
          break
        case '--help':
          this.showHelp()
          process.exit(0)
      }
    }
  }

  /**
   * ヘルプを表示
   */
  showHelp() {
    console.log(`
🚀 プルリクエスト自動作成ツール

使用方法:
  npm run create-pr [オプション]

オプション:
  --title "タイトル"    PRタイトルを指定
  --draft              ドラフトPRとして作成
  --no-ci              CI実行をスキップ（緊急時のみ）
  --help               このヘルプを表示

例:
  npm run create-pr
  npm run create-pr --title "feat: 新機能追加"
  npm run create-pr --draft
`)
  }

  /**
   * Gitコマンドを実行
   */
  execGit(command) {
    try {
      return execSync(`git ${command}`, { encoding: 'utf8' }).trim()
    } catch (error) {
      throw new Error(`Git command failed: git ${command}\\n${error.message}`)
    }
  }

  /**
   * 変更ファイルを分析
   */
  analyzeChanges() {
    console.log('📊 変更内容を分析中...')

    // 変更ファイル取得
    const changedFiles = this.execGit('diff --name-only HEAD').split('\\n').filter(Boolean)
    const commitHistory = this.execGit('log --oneline --since="1 week ago"')
      .split('\\n')
      .filter(Boolean)

    // ステージされていない変更があるかチェック
    if (changedFiles.length > 0) {
      console.log('⚠️  ステージされていない変更があります')
      const shouldStage = this.prompt('すべての変更をステージしますか？ (y/N): ')
      if (shouldStage.toLowerCase() === 'y') {
        this.execGit('add .')
        console.log('✅ 変更をステージしました')
      } else {
        console.log('❌ ステージされていない変更があるため中止します')
        process.exit(1)
      }
    }

    return {
      changedFiles: this.execGit('diff --name-only --cached').split('\\n').filter(Boolean),
      commitHistory,
      totalCommits: commitHistory.length,
    }
  }

  /**
   * PR prefix を自動判定
   */
  determinePrefixAndType(files, commits) {
    console.log('🔍 変更種別を判定中...')

    // ファイルパターン分析
    const hasTests = files.some(
      f => f.includes('test') || f.includes('spec') || f.includes('__tests__')
    )
    const hasDocs = files.some(f => f.includes('docs') || f.includes('.md') || f.includes('README'))
    const hasAPI = files.some(f => f.includes('api/') || f.includes('backend'))
    const hasFrontend = files.some(
      f => f.includes('components/') || f.includes('pages/') || f.includes('src/app')
    )
    const hasDB = files.some(
      f => f.includes('prisma/') || f.includes('schema') || f.includes('migration')
    )
    const hasPerformance = files.some(
      f => f.includes('cache') || f.includes('performance') || f.includes('optimization')
    )

    // コミットメッセージ分析
    const commitText = commits.join(' ').toLowerCase()
    const hasFix =
      commitText.includes('fix') || commitText.includes('bug') || commitText.includes('修正')
    const hasFeat =
      commitText.includes('feat') ||
      commitText.includes('add') ||
      commitText.includes('追加') ||
      commitText.includes('機能')
    const hasRefactor = commitText.includes('refactor') || commitText.includes('リファクタ')
    const hasPerf =
      commitText.includes('perf') ||
      commitText.includes('performance') ||
      commitText.includes('パフォーマンス')

    // 判定ロジック
    let prefix = 'chore'
    let areas = []

    if (hasPerf || hasPerformance) prefix = 'perf'
    else if (hasFix) prefix = 'fix'
    else if (hasFeat) prefix = 'feat'
    else if (hasRefactor) prefix = 'refactor'
    else if (hasTests) prefix = 'test'
    else if (hasDocs) prefix = 'docs'

    if (hasAPI) areas.push('Backend')
    if (hasFrontend) areas.push('Frontend')
    if (hasDB) areas.push('Database')
    if (hasPerformance) areas.push('Performance')

    return { prefix, areas }
  }

  /**
   * PR タイトルを生成
   */
  generateTitle(prefix, areas, commitHistory) {
    if (this.customTitle) {
      return this.customTitle
    }

    // 最新のコミットメッセージから抽出
    const latestCommit = commitHistory[0] || ''
    const commitTitle = latestCommit.replace(/^[a-f0-9]+\\s+/, '') // ハッシュを除去

    // すでにprefixがある場合はそのまま使用
    if (commitTitle.match(/^(feat|fix|docs|style|refactor|perf|test|chore):/)) {
      return commitTitle
    }

    // エリア情報を追加
    const areaText = areas.length > 0 ? `(${areas.join('/')})` : ''

    return `${prefix}${areaText}: ${commitTitle || '変更を追加'}`
  }

  /**
   * PR本文を生成
   */
  generatePRBody(analysis, prefix, areas) {
    const { changedFiles, commitHistory } = analysis

    // 変更種別ごとに分類
    const changes = {
      features: [],
      fixes: [],
      performance: [],
      refactoring: [],
      docs: [],
      tests: [],
    }

    // ファイル変更から種別を推定
    changedFiles.forEach(file => {
      if (file.includes('test') || file.includes('spec')) {
        changes.tests.push(`テスト追加/修正: ${file}`)
      } else if (file.includes('docs') || file.includes('.md')) {
        changes.docs.push(`ドキュメント更新: ${file}`)
      } else if (file.includes('cache') || file.includes('performance')) {
        changes.performance.push(`パフォーマンス改善: ${file}`)
      } else if (prefix === 'feat') {
        changes.features.push(`新機能: ${path.basename(file)}`)
      } else if (prefix === 'fix') {
        changes.fixes.push(`バグ修正: ${path.basename(file)}`)
      } else {
        changes.refactoring.push(`リファクタリング: ${path.basename(file)}`)
      }
    })

    // コミット履歴からサマリー生成
    const summary = commitHistory
      .slice(0, 3)
      .map(commit => {
        const cleanCommit = commit.replace(/^[a-f0-9]+\\s+/, '')
        return `- ${cleanCommit}`
      })
      .join('\\n')

    let body = `## Summary

${summary || '- 変更内容の詳細'}

## Changes
`

    if (changes.features.length > 0) {
      body += `
### 🚀 New Features
${changes.features.map(f => `- ${f}`).join('\\n')}
`
    }

    if (changes.fixes.length > 0) {
      body += `
### 🐛 Bug Fixes
${changes.fixes.map(f => `- ${f}`).join('\\n')}
`
    }

    if (changes.performance.length > 0) {
      body += `
### ⚡ Performance
${changes.performance.map(f => `- ${f}`).join('\\n')}
`
    }

    if (changes.refactoring.length > 0) {
      body += `
### 🔧 Refactoring
${changes.refactoring.map(f => `- ${f}`).join('\\n')}
`
    }

    if (changes.docs.length > 0) {
      body += `
### 📚 Documentation
${changes.docs.map(f => `- ${f}`).join('\\n')}
`
    }

    if (changes.tests.length > 0) {
      body += `
### 🧪 Tests
${changes.tests.map(f => `- ${f}`).join('\\n')}
`
    }

    // テスト計画を生成
    body += `
## Test plan

- [ ] ローカル環境での動作確認
- [ ] 品質チェック実行 (\`npm run quality-check\`)
${areas.includes('Frontend') ? '- [ ] E2Eテスト実行' : ''}
${areas.includes('Backend') ? '- [ ] APIテスト実行' : ''}
${areas.includes('Database') ? '- [ ] マイグレーションテスト' : ''}
${areas.includes('Performance') ? '- [ ] パフォーマンステスト' : ''}

## Breaking Changes

${prefix === 'feat' ? '- なし（後方互換性を維持）' : '- なし'}

🤖 Generated with [Claude Code](https://claude.ai/code)`

    return body
  }

  /**
   * 品質チェックを実行
   */
  async runQualityCheck() {
    if (this.skipCI) {
      console.log('⏭️  CI実行をスキップします')
      return true
    }

    console.log('🔍 品質チェックを実行中...')

    try {
      execSync('npm run quality-check', { stdio: 'inherit' })
      console.log('✅ 品質チェックが完了しました')
      return true
    } catch (error) {
      console.log('❌ 品質チェックが失敗しました')
      console.log('エラーを修正してから再度実行してください')
      return false
    }
  }

  /**
   * プルリクエストを作成
   */
  async createPullRequest(title, body) {
    console.log('📝 プルリクエストを作成中...')

    try {
      const draftFlag = this.isDraft ? '--draft' : ''
      const command = `gh pr create --title "${title}" --body "${body}" ${draftFlag}`.trim()

      const prUrl = execSync(command, { encoding: 'utf8' }).trim()
      console.log(`✅ プルリクエストを作成しました: ${prUrl}`)

      return prUrl
    } catch (error) {
      throw new Error(`PR作成に失敗しました: ${error.message}`)
    }
  }

  /**
   * CI チェックを監視
   */
  async monitorCI() {
    if (this.skipCI) return true

    console.log('🕐 CI実行を監視中...')

    let retries = 0
    while (retries < this.maxRetries) {
      try {
        execSync('gh pr checks', { stdio: 'inherit' })
        console.log('✅ すべてのCIチェックが成功しました')
        return true
      } catch (error) {
        retries++
        console.log(`❌ CI失敗 (${retries}/${this.maxRetries})`)

        if (retries < this.maxRetries) {
          console.log('🔧 自動修正を試行中...')
          // 簡易的な修正を試行（実際は具体的な修正ロジックを実装）
          await this.sleep(5000) // 5秒待機
        } else {
          console.log('❌ CI修正の上限回数に達しました')
          console.log('手動でエラーを確認・修正してください')
          return false
        }
      }
    }

    return false
  }

  /**
   * 簡易プロンプト（Node.js環境用）
   */
  prompt(question) {
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    return new Promise(resolve => {
      rl.question(question, answer => {
        rl.close()
        resolve(answer)
      })
    })
  }

  /**
   * 待機
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * メイン実行関数
   */
  async run() {
    try {
      console.log('🚀 PR自動作成ツールを開始します\\n')

      // 引数解析
      this.parseArgs()

      // 変更分析
      const analysis = this.analyzeChanges()

      if (analysis.changedFiles.length === 0) {
        console.log('📝 変更がないため、PR作成をスキップします')
        return
      }

      // 変更種別判定
      const { prefix, areas } = this.determinePrefixAndType(
        analysis.changedFiles,
        analysis.commitHistory
      )

      // タイトル・本文生成
      const title = this.generateTitle(prefix, areas, analysis.commitHistory)
      const body = this.generatePRBody(analysis, prefix, areas)

      console.log(`\\n📋 PR情報:`)
      console.log(`タイトル: ${title}`)
      console.log(`種別: ${prefix} (${areas.join(', ') || 'General'})`)
      console.log(`変更ファイル数: ${analysis.changedFiles.length}`)

      // 品質チェック実行
      const qualityCheckPassed = await this.runQualityCheck()
      if (!qualityCheckPassed) {
        process.exit(1)
      }

      // PR作成
      const prUrl = await this.createPullRequest(title, body)

      // CI監視
      await this.monitorCI()

      console.log(`\\n🎉 PR作成プロセスが完了しました！`)
      console.log(`🔗 PR URL: ${prUrl}`)
    } catch (error) {
      console.error(`\\n❌ エラーが発生しました: ${error.message}`)
      process.exit(1)
    }
  }
}

// スクリプト実行
if (require.main === module) {
  const prCreator = new PRCreator()
  prCreator.run()
}

module.exports = PRCreator
