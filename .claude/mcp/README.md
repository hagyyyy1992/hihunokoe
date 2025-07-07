# MCP (Model Context Protocol) Setup

## 概要

MCP (Model Context Protocol) は、LLMが外部ツールやデータソースにアクセスできるようにするオープンプロトコルです。このプロジェクトでは、Claude Codeと統合して開発効率を向上させるために使用します。

## 設定済みのMCPサーバー

`.mcp.json`に以下のサーバーが設定されています：

### 1. Filesystem Server

- **目的**: ファイルシステムへの安全なアクセス
- **スコープ**: プロジェクトディレクトリ (`/Users/hagiharakeiichi/work/my-app/usaka`)
- **利用例**: ファイルの読み書き、ディレクトリ操作

### 2. Git Server

- **目的**: Gitリポジトリ操作
- **スコープ**: 現在のGitリポジトリ
- **利用例**: コミット履歴確認、ブランチ操作、差分確認

### 3. Memory Server

- **目的**: セッション間での情報保持
- **スコープ**: プロジェクト全体
- **利用例**: 重要な決定事項や文脈の保存

### 4. Playwright Server

- **目的**: ブラウザ自動化とE2Eテスト
- **パッケージ**: `@playwright/mcp` (Microsoft公式)
- **特徴**:
  - アクセシビリティツリーを利用した高速動作
  - スクリーンショット不要の構造化データ操作
  - 永続的ブラウザプロファイルと分離テスト環境の両方をサポート
- **利用例**:
  - E2Eテストの実行と監視
  - ブラウザ操作の自動化
  - Webページのデータ抽出

### 5. Figma Server

- **目的**: Figmaデザインへのアクセスとコード生成
- **パッケージ**: `@modelcontextprotocol/server-figma`
- **設定**: Figma API キーが必要（後述の設定手順参照）
- **特徴**:
  - Figmaファイルとプロジェクトへの読み取りアクセス
  - デザイントークンと変数の抽出
  - コンポーネント情報の取得
- **利用例**:
  - デザインからのコード生成
  - デザイントークンの同期
  - コンポーネント仕様の確認

## セットアップ手順

1. **Claude Codeでの有効化**:

   ```bash
   # プロジェクトディレクトリで実行
   claude mcp reload
   ```

2. **サーバーの確認**:

   ```bash
   claude mcp list
   ```

3. **サーバーのテスト**:
   - Claude Codeで`@filesystem`と入力してファイルシステムサーバーが利用可能か確認
   - `@git`で Gitサーバーの動作確認
   - `@memory`でメモリサーバーの動作確認
   - `@playwright`でPlaywrightサーバーの動作確認
   - `@figma`でFigmaサーバーの動作確認（API キー設定後）

## 使用方法

### ファイルシステム操作

```
@filesystem ファイルを作成
@filesystem ディレクトリ構造を表示
```

### Git操作

```
@git 最近のコミットを表示
@git 現在のブランチ状態を確認
```

### メモリ管理

```
@memory この決定を記憶して: [重要な決定事項]
@memory 以前の決定事項を表示
```

### Playwright操作

```
@playwright E2Eテストを実行
@playwright ブラウザでページを開く
@playwright 要素をクリック
@playwright フォームに入力
```

### Figma操作

```
@figma プロジェクトのファイル一覧を取得
@figma コンポーネント情報を取得
@figma デザイントークンを抽出
@figma 変数と定義を取得
```

## Figma API キーの設定

Figmaサーバーを使用するには、Figma API キーが必要です：

1. **Figma API キーの取得**:

   - Figmaにログイン → Settings → Security
   - 「Personal Access Tokens」セクションで新しいトークンを生成
   - トークンをコピー

2. **API キーの設定**:

   - `.mcp.json`の`figma`セクションで`YOUR_FIGMA_API_KEY_HERE`を実際のキーに置き換え
   - または環境変数として設定：
     ```bash
     export FIGMA_API_KEY="your-actual-api-key"
     ```

3. **セキュリティ注意事項**:
   - API キーを`.mcp.json`に直接記載する場合は、ファイルをGitにコミットしない
   - 環境変数を使用することを推奨

## セキュリティ考慮事項

1. **アクセス制限**: Filesystemサーバーはプロジェクトディレクトリに制限
2. **認証情報**: 環境変数や機密情報へのアクセスは制限
3. **サードパーティサーバー**: 信頼できるサーバーのみを使用
4. **API キー管理**: Figma API キーは環境変数で管理することを推奨

## トラブルシューティング

### サーバーが利用できない場合

1. `.mcp.json`ファイルが存在することを確認
2. `claude mcp reload`を実行
3. Claude Codeを再起動

### パーミッションエラー

1. ファイルシステムの権限を確認
2. 必要に応じて`chmod`でアクセス権を調整

## 追加のMCPサーバー

プロジェクトの要件に応じて、以下のサーバーも追加可能：

- `@modelcontextprotocol/server-postgres`: PostgreSQLデータベース操作
- `@modelcontextprotocol/server-github`: GitHub API統合
- `@modelcontextprotocol/server-slack`: Slack統合
- `@executeautomation/playwright-mcp-server`: テストコード生成特化版のPlaywright

追加方法：

```bash
claude mcp add [サーバー名] -- npx -y @modelcontextprotocol/server-[名前]
```

### Playwright MCPの選択肢

1. **@playwright/mcp** (推奨・現在使用中)

   - Microsoft公式
   - アクセシビリティツリーベースの高速動作
   - スクリーンショット不要

2. **@executeautomation/playwright-mcp-server**
   - スクリーンショット付きブラウザ自動化
   - テストコード生成機能
   - ```bash
     claude mcp add playwright-automation --scope project -- npm exec -y @executeautomation/playwright-mcp-server
     ```

### Figma MCPの選択肢

1. **@modelcontextprotocol/server-figma** (現在使用中)

   - 標準的なFigma API統合
   - 読み取り専用アクセス
   - stdioとSSEトランスポートサポート

2. **figma-developer-mcp** (Cursor最適化版)

   - Cursor IDE向けに最適化
   - AI向けにレスポンスを簡略化
   - ```bash
     claude mcp add figma-dev --scope project -- npx -y figma-developer-mcp --figma-api-key=YOUR-KEY --stdio
     ```

3. **公式Figma Dev Mode Server** (ベータ・有料プラン必要)
   - Figmaデスクトップアプリ限定
   - Code Connect統合
   - React + Tailwindコード生成
