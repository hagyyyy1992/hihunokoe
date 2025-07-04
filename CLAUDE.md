# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hihunokoe is a comprehensive cosmetics experience sharing service built with Next.js 15 and TypeScript. The application allows users to share authentic cosmetic experiences, discover products that might suit their skin type and preferences, and includes a complete admin panel for content moderation and user management.

## Architecture

### Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + bcrypt with email verification
- **Email**: Resend (production) / MailHog (development)
- **Deployment**: Vercel

### Database Configuration

The application uses a flexible database configuration system (`src/lib/db-config.ts`) that supports:

- **Local development**: Docker PostgreSQL container with Adminer web interface
- **Production**: Supabase
- **Mock mode**: In-memory demo data when database is unavailable
- **Database tools**: Docker Compose includes Adminer (http://localhost:8080) for database management

### Key Files

- `src/lib/auth/auth.ts` - Authentication logic with dual mode (database/mock)
- `src/lib/auth/admin-middleware.ts` - Admin authentication middleware
- `src/lib/prisma.ts` - Database client initialization
- `prisma/schema.prisma` - Database schema with User, Post, Empathy, Comment, AdminLog models
- `src/lib/mock-data.ts` - Demo data for offline development
- `src/app/admin/` - Complete admin panel with dashboard, user management, and content moderation

## Development Commands

### Setup

```bash
# Initial setup with all services
npm run dev:setup

# Quick development start
npm run dev

# Full development environment
npm run dev:full
```

### Database

```bash
# Start local PostgreSQL
npm run db:setup

# Reset database completely
npm run db:nuke

# Run migrations
npm run db:migrate

# Seed with demo data
npm run db:seed

# Open database studio
npm run db:studio
```

### Testing & Quality

```bash
# Unit & Integration tests (Jest)
npm test
npm run test:watch
npm run test:coverage
npm run test:api

# E2E tests (Playwright)
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
npm run test:e2e:debug
npm run test:e2e:report

# Lint code
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

### Email & Database Testing

```bash
# Start MailHog for email testing
npm run mailhog:start

# Stop MailHog
npm run mailhog:stop

# Database management
npm run db:clean    # Reset database with force
npm run db:status   # Check database connection status
```

## Code Conventions

### Authentication

- Use `src/lib/auth/auth.ts` for all authentication operations
- Authentication automatically falls back to mock users when database is unavailable
- Email verification system is implemented with configurable email providers
- Password reset functionality with secure token-based flow
- Account deletion with cascade deletion of user data
- Admin authentication with role-based access control (USER, ADMIN, SUPER_ADMIN)
- Admin action logging in AdminLog model

### Database Operations

- Always check `isDatabaseAvailable()` before database operations
- Use the dual-mode pattern: try database first, fallback to mock data
- All database models use UUID primary keys
- Soft deletion for users with `deletedAt` timestamp
- Comprehensive user profile fields including skin type, allergies, body type
- Admin logging for all administrative actions

### Component Structure

- UI components in `src/components/ui/`
- Form components in `src/components/forms/`
- Layout components in `src/components/layout/`
- Follow existing naming conventions and prop patterns

### Import Path Conventions

- **Always use absolute paths with `@/` prefix** instead of relative paths (`../`, `./`)
- Available path mappings in `tsconfig.json`:
  - `@/*` → `./src/*` (main source code)
  - `@api/*` → `./api/src/*` (clean architecture API layer)
  - `@tests/*` → `./__tests__/*` (test files)
  - `@e2e/*` → `./e2e/*` (E2E test files)
- **Examples:**
  - ❌ `import { auth } from '../../../lib/auth/auth'`
  - ✅ `import { auth } from '@/lib/auth/auth'`
  - ❌ `import { UserController } from '../../../../../../api/src/framework/controllers/UserController'`
  - ✅ `import { UserController } from '@api/framework/controllers/UserController'`
- **Test files**: Use `@/` for source imports, `@tests/` for test helpers
- **Exceptions**: Only use relative paths for same-directory imports (e.g., `./types`)

### API Routes

- All API routes follow Next.js App Router conventions
- Use proper error handling and status codes
- Authentication routes in `src/app/api/auth/` (login, register, password reset, email verification, account deletion)
- Post-related routes in `src/app/api/posts/` (CRUD operations, empathy system)
- Admin routes in `src/app/api/admin/` (user management, post moderation, dashboard stats)
- Profile management in `src/app/api/profile/`
- Testing utilities in `src/app/api/test/` (cleanup, rate limiter reset)
- API versioning support with `src/app/api/v2/`

### Clean Architecture (API Layer)

- **Directory structure**: `api/src/` follows clean architecture principles
- **Layers**: Domain → Use Cases → Interface Adapters → Frameworks
- **Naming conventions**:
  - Use Cases: `interactor.ts` (implementation), `input-port.ts`, `output-port.ts`
  - Repositories: `UserRepository` (interface), `UserRepositoryImpl` (implementation)
  - Services: `PasswordHashService` (interface), `PasswordHashServiceImpl` (implementation)
- **Dependency rule**: Inner layers don't depend on outer layers
- **Testing**: Each layer can be tested independently with mocks
- **Documentation**: See `docs/backend/clean-architecture.md` for detailed guidelines

## Git Commit Message Conventions

このプロジェクトでは、コミットメッセージの可読性と追跡性を向上させるため、以下の原則に従います。

### Prefix形式

```
prefix: 〇〇なため、△△を追加/修正/削除
```

### 使用するPrefix

- **feat**: 新しい機能の追加
- **fix**: バグの修正
- **docs**: ドキュメントのみの変更
- **style**: コードの動作に影響しない変更（空白、フォーマット、セミコロンなど）
- **refactor**: バグ修正や機能追加ではないコード改善
- **perf**: パフォーマンス向上に関する変更
- **test**: テストの追加や修正
- **chore**: ビルドプロセス、補助ツール、ライブラリの変更

### 具体例

```bash
# Good examples
feat: ユーザー認証機能を強化するため、メール認証を追加
fix: モバイル表示が崩れるため、ヘッダーのレスポンシブ対応を修正
docs: 新規開発者向けにセットアップ手順を追加
refactor: コードの可読性向上のため、認証ロジックを関数に分離
test: E2Eテストの安定性向上のため、認証フローのテストを改善
chore: CI/CDパイプラインの実行時間短縮のため、並列実行を追加

# Bad examples
fix: 修正
feat: 追加
update: 更新
```

### 原則

1. **理由を明記する**: なぜその変更が必要だったのかを「〇〇なため」で表現
2. **日本語で記述**: チーム内でのコミュニケーションを円滑にするため
3. **適切なprefixを選択**: 変更の性質を正確に表現
4. **コミットサイズを適切に**: 1つのprefixで表現できる範囲での変更

## コミットの粒度とベストプラクティス

### 基本原則

効果的なコミット戦略により、コードレビューの効率化、障害対応の迅速化、開発履歴の可読性向上を実現する。

### 🎯 コミットの適切な単位

#### 1. **エラーがなく動く単位でコミットする**

**必須条件**:

- コンパイルエラーがない
- 実行時エラーが発生しない
- 静的解析（ESLint）が通る
- 単体テストが成功する
- TypeScript型チェックが通る

**理由**: 障害対応時にコミットを遡って検証する際、動かないコミットがあると検証が停止してしまう

**実装方法**:

```bash
# 必ずプッシュ前にチェック実行
npm run format && npm run lint && npm test && npx tsc --noEmit
```

#### 2. **機能的に意味のある単位でコミット**

**推奨パターン**:

- **UI変更 + 関連する関数 + テスト**: 1コミット
- **サービス層の変更 + テスト**: 別コミット
- **データベーススキーマ変更**: 単独コミット

**例**:

```bash
# Good: 機能的にまとまっている
feat: ユーザープロフィール編集機能を追加するため、フォーム・バリデーション・APIを実装

# Bad: 無関係な変更が混在
feat: ユーザープロフィール編集機能追加とtypo修正とEslint設定変更
```

#### 3. **rename・ファイル移動は別コミット**

**分離すべき変更**:

- ファイル名変更
- ディレクトリ移動
- 関数・変数名のrename
- import文の修正

**実装例**:

```bash
# 1st commit: rename のみ
refactor: コードの可読性向上のため、AuthService を UserAuthService にrename

# 2nd commit: ロジック変更
feat: 認証機能を強化するため、二段階認証を追加
```

**メリット**:

- レビューがしやすい
- ロジック変更に集中できる
- コンフリクト解決が容易

#### 4. **レビュー指摘対応は指摘ごとにコミット**

**推奨方法**:

```bash
# 指摘の理由を明記
fix: パフォーマンス向上のため、無限ループを回避する条件を追加
fix: セキュリティ強化のため、入力値のサニタイズを追加
```

**まとめるケース**:

- 同じ理由による複数箇所の修正
- 同じESLintルールによる修正

#### 5. **タスク外の修正は別コミット**

**ボーイスカウト精神**: 「来た時よりも美しく」

**別コミットにする修正**:

```bash
# Good: タスクと分離
feat: ユーザー認証機能を追加
fix: typo修正 - "recieve" を "receive" に修正
docs: コメントの誤記を修正

# Bad: タスクに混在
feat: ユーザー認証機能追加とtypo修正
```

**さらに別PRにするケース**:

- ロジック変更を伴う改善
- 影響範囲が大きい修正
- 検討が必要な変更

#### 6. **コマンド実行結果は1コミット**

**対象コマンド**:

- `npm run format`
- `npx prisma generate`
- 自動生成スクリプト

**コミット例**:

```bash
chore: Prettier自動フォーマット実行
chore: Prisma Clientを最新スキーマで再生成
```

### 🚫 避けるべきコミットパターン

#### ❌ 動かないコミット

```bash
# Bad: コンパイルエラーがある状態
feat: 認証機能追加（未完成）
```

#### ❌ 意味のないメッセージ

```bash
# Bad: 何をしたかわからない
fix: 修正
feat: 追加
update: 更新
```

#### ❌ 無関係な変更の混在

```bash
# Bad: 複数の無関係な変更
feat: ログイン機能追加とtypo修正とpackage.json更新
```

### 💡 コミットメッセージが思いつかない場合

**チェックポイント**:

1. コミットが小さすぎて意味をなしていないか？
2. 複数の異なる変更が混在していないか？
3. **Why**（なぜ）を説明できるか？

**対処法**:

- もう少し実装を進めてから一緒にコミット
- 変更を種類別に分けて複数コミットに分割
- 一旦コミットして後でrebaseで整理

### 🔧 便利なGitコマンド

#### コミット履歴の整理

```bash
# 直前のコミットを修正
git commit --amend

# 過去のコミットを整理（interactive rebase）
git rebase -i HEAD~3

# コミットの分割・統合・並び替えが可能
```

#### ⚠️ rebaseの注意事項

- **リモートにpush済みのコミットは絶対にrebaseしない**
- チーム共有ブランチでのrebaseは禁止
- 個人の作業ブランチでのみ使用

### 📋 コミット前チェックリスト

- [ ] コンパイルエラーがない
- [ ] 実行時エラーが発生しない
- [ ] `npm run format && npm run lint && npm test && npx tsc --noEmit` が成功
- [ ] コミットメッセージが適切（prefix + 理由）
- [ ] 単一の責務・目的にフォーカスしている
- [ ] レビュアーが理解しやすい単位である
- [ ] 必要に応じてテストが含まれている

## Important Notes

### Environment Variables

- Development environment is pre-configured
- Production requires `RESEND_API_KEY` for email functionality
- Database URLs are managed by `db-config.ts`

### Mock Data & Admin Panel

- Demo users available for testing (password: `demo123`)
- Mock mode enables offline development
- Controlled by `USE_MOCK_DATA` environment variable
- Admin panel accessible at `/admin` with role-based permissions
- Admin dashboard with user statistics and content moderation tools
- Comprehensive user management with activation/suspension features

### Email System

- Complete email verification system with configurable providers
- Password reset emails with secure token-based flow
- MailHog runs on http://localhost:8025 for testing
- Production uses Resend API
- Configurable email templates and providers in `src/lib/email/`

## Testing Strategy

### Unit & Integration Tests (Jest)

- Location: `__tests__/` directory
- Components: `__tests__/components/`
- API routes: `__tests__/api/`
- Helpers: `__tests__/helpers/`
- Test environment: Node.js with JSDOM for component tests
- Coverage: Component logic, API endpoints, authentication flows

### E2E Tests (Playwright)

- Location: `e2e/` directory
- Authentication flows: `e2e/auth/`
- Post management: `e2e/posts/`
- Search & filters: `e2e/posts/search-posts.spec.ts`
- Test environment: Real browser automation (Chromium, Firefox, Safari)
- Coverage: User workflows, cross-browser compatibility, visual regression

### Test Data Strategy

- Unit tests: Mock data and API responses
- E2E tests: Real database with test-specific data
- Use `data-testid` attributes for reliable element selection
- Isolated test environments prevent data conflicts

## Development Workflow

1. **Start development**: `npm run dev:setup` (first time) or `npm run dev`
2. **Database changes**: Update schema → `npm run db:migrate` → `npm run db:seed`
3. **Email testing**: Use MailHog web interface at http://localhost:8025
4. **Unit testing**: Run `npm test` during development
5. **E2E testing**: Run `npm run test:e2e` before major releases
6. **Code quality**: Run `npm run lint` and `npm run format` before committing

### Pre-Push Checklist

プッシュ前に必ず以下のチェックを実行してコード品質を保証する：

```bash
# フォーマット確認・修正
npm run format

# Lint確認・修正
npm run lint

# テスト実行
npm test
npm run test:e2e  # 重要な変更の場合

# TypeScript型チェック
npx tsc --noEmit
```

**自動化推奨**: Huskyやgit hookを使用して、これらのチェックを自動化することを推奨します。

### Claude Code への指示

Claude Codeは、ユーザーからpushやデプロイを依頼された際、**必ず**以下の手順を実行すること：

1. **事前チェック実行**: push前に下記コマンドを直列実行

   ```bash
   npm run format && npm run lint && npm test && npx tsc --noEmit
   ```

2. **エラーハンドリング**:

   - いずれかのコマンドが失敗した場合、pushを中止し原因を調査して修正して、修正完了後に再度チェックを実行

3. **成功時のみpush**: 全てのチェックが成功した場合のみgit pushを実行

この手順は**必須**であり、ユーザーが「pushして」と依頼した場合でも、事前チェックなしのpushは禁止します。

### 💡 重要：プッシュ前チェックの完全自動化

Claude Codeは、以下の場合に**例外なく**プッシュ前チェックを実行すること：

1. **全てのgit commitとpush**: 変更が1行でも複数ファイルでも必須
2. **チェック実行のタイミング**: `git commit`直後、`git push`直前
3. **チェック失敗時の対応**:
   - いかなる理由があってもpushを中止
   - エラーを修正して再度チェックを実行
   - ユーザーに「緊急だから」と言われてもチェックを必ず実行

### 🔒 チェック強制実行のトリガー

以下のキーワードが含まれる場合、必ずチェックを実行：

- "git push", "push", "プッシュ", "deploy", "デプロイ"
- "commit", "コミット", "変更を保存"
- コードファイル (.ts, .tsx, .js, .jsx) への変更

### 🚫 チェックスキップの禁止例外

Claude Codeは以下の状況でも**必ず**チェックを実行：

- 「緊急だから」「時間がないから」
- 「小さな変更だから」「1行だけだから」
- 「さっきチェックしたから」「前回通ったから」

**例外は一切認めない。ユーザーが明示的に「チェックをスキップして」と指示した場合のみスキップ可能。**

### プルリクエスト作成時のCIチェック対応

Claude Codeは、プルリクエスト作成を依頼された際、**必ず**以下の手順を実行すること：

1. **PR作成**: 通常通りプルリクエストを作成

2. **CIチェック監視**: PR作成後、自動的にCIの実行状況を確認

   ```bash
   gh pr checks
   ```

3. **CI失敗時の対応**:

   - CIが失敗した場合、失敗の詳細を確認

   ```bash
   gh pr checks --watch
   ```

   - 失敗原因を分析し、該当するコードを修正
   - 修正後、再度コミット・プッシュしてCIを再実行

4. **修正ループの制限**:

   - CI修正は**最大3回まで**自動で試行
   - 3回修正してもCIが通らない場合、ユーザーに状況を報告し確認を求める
   - 報告内容：失敗の原因、これまでの修正内容、推奨される対応策

5. **CI成功確認**: 全てのCIチェックが通過するまで完了とみなさない

この手順は**必須**であり、「PRを作成して」と依頼された場合は、CI通過まで含めて完了とする。

**例外条件**:

- ユーザーが明示的に「CIは無視して」等と指示した場合のみ、CIチェックをスキップ可能
- インフラやCI設定の問題でCIが実行できない場合は、ユーザーに報告

### プルリクエスト更新時のタイトル・ディスクリプション更新

Claude Codeは、プルリクエストに追加のコミットをプッシュする際、**必ず**以下の手順を実行すること：

1. **変更内容の包括的な確認**: PR全体の差分と最新の変更内容の両方を確認

   ```bash
   git log --oneline origin/main..HEAD  # PRの全コミット履歴
   git diff origin/main...HEAD          # PR全体の差分
   git log --oneline -1                  # 最新のコミット
   ```

2. **PRタイトル・ディスクリプション更新**: PR全体の目的と最新の変更内容を統合して更新

   ```bash
   gh pr edit --title "新しいタイトル" --body "$(cat <<'EOF'
   ## Summary
   PRの全体的な目的と最新の変更内容を統合した概要...

   ## Changes
   - PR全体で追加された機能
   - 修正されたバグ・問題
   - 改善されたパフォーマンス・UX
   - 最新のコミットで追加された内容

   ## Test plan
   [PRの全体的なテスト計画と最新の変更に対するテスト...]

   🤖 Generated with [Claude Code](https://claude.ai/code)
   EOF
   )"
   ```

3. **更新方針**:
   - タイトル：PRの全体的な目的を保ちつつ、最新の重要な変更も反映
   - ディスクリプション：PR全体の文脈の中で最新の変更がどう位置づけられるかを明示
   - レビュアーがPRの進化の過程と現在の状態を両方理解できるように構成

この更新は**自動実行**し、プッシュの度に最新情報を保つことで、レビューの効率性と品質を向上させる。

### ⚠️ 重要：マージに関する絶対的な制約

Claude Codeは、以下の条件を満たさない限り、**絶対にプルリクエストをマージしてはならない**：

1. **必須条件（ALL PASS）**:

   - ✅ 全てのCIチェックが成功（Build Test, Lint & Type Check, Unit Tests）
   - ✅ ユーザーから明示的なマージ指示（「マージして」「merge」等）
   - ✅ レビューが完了している（該当する場合）

2. **禁止事項**:

   - ❌ CIが失敗している状態でのマージ
   - ❌ ユーザーの明示的指示なしでの自動マージ
   - ❌ 「CI修正が困難」を理由とした強制マージ

3. **CI失敗時の対応**:

   - 最大3回まで修正を試行
   - 3回修正後もCI失敗の場合は、ユーザーに状況報告し指示を仰ぐ
   - **絶対にマージを勝手に実行しない**

4. **例外条件**:
   - ユーザーが「CIは無視してマージして」等と明示的に指示した場合のみ

**違反例**: 「CIが複雑で修正困難なため」「機能は動作するため」等の理由での勝手なマージ

**正しい対応**: CI失敗状況とこれまでの修正内容をユーザーに報告し、指示を仰ぐ

## 📦 依存関係管理の必須ルール

### 🚨 絶対にコミットすべきファイル

以下のファイルが変更された場合、**理由に関わらず必ずコミット**：

- `package.json` - 依存関係の変更
- `package-lock.json` - 依存関係のロック
- `yarn.lock` - Yarn使用時のロック
- `pnpm-lock.yaml` - pnpm使用時のロック

### ❌ 危険な判断例

- 「自動で追加されたから」→ ❌ 必要だから追加された
- 「機能に直接関係ないから」→ ❌ ビルドに必要
- 「開発環境だけの変更」→ ❌ CI/CDでも必要

### ✅ 正しい対応

1. 依存関係ファイルの変更を発見
2. 変更理由を確認（なぜ追加/更新されたか）
3. **必ずコミットして同期**
4. チーム全体で同じ環境を維持

### 🔍 チェックポイント

プッシュ前に必ず確認：

```bash
git status | grep -E "(package|lock|yarn)" && echo "依存関係ファイルが変更されています。必ずコミットしてください。"
```

### 📋 Claude Codeへの指示

Claude Codeは、以下の場合に**例外なく**依存関係ファイルをコミットすること：

1. **チェック実行時**: npm run lint、npm test、npx tsc等でパッケージが自動インストールされた場合
2. **ツール実行時**: prettier、eslint等の実行で依存関係が変更された場合
3. **ライブラリ追加時**: 新しいパッケージを手動でインストールした場合

**理由を問わず、依存関係ファイルの変更は必須のコミット対象**とする。

## 文書構成

```
docs/
├── README.md                           # プロジェクト概要（全ロール共通）
├── business/                           # ビジネス・企画関連
│   ├── project-overview.md             # プロジェクト概要
│   ├── user-research.md                # ユーザーリサーチ
│   ├── competitive-analysis.md         # 競合分析
│   ├── business-requirements.md        # ビジネス要件
│   └── kpi-metrics.md                  # KPI・指標
├── design/                             # デザイン関連
│   ├── design-system.md                # デザインシステム
│   ├── user-flows.md                   # ユーザーフロー
│   ├── wireframes.md                   # ワイヤーフレーム
│   ├── ui-specifications.md            # UI仕様
│   └── component-library.md            # コンポーネントライブラリ
├── backend/                            # バックエンド関連
│   ├── database-design.md              # データベース設計
│   ├── api-specifications.md           # API仕様
│   ├── authentication.md               # 認証システム
│   ├── security.md                     # セキュリティ仕様
│   └── performance.md                  # パフォーマンス要件
├── frontend/                           # フロントエンド関連
│   ├── project-structure.md            # プロジェクト構成
│   ├── component-specifications.md     # コンポーネント仕様
│   ├── state-management.md             # 状態管理
│   ├── routing.md                      # ルーティング
│   └── integration.md                  # API統合
├── infrastructure/                     # インフラ・DevOps関連
│   ├── architecture.md                 # システム構成
│   ├── deployment.md                   # デプロイメント
│   ├── ci-cd.md                        # CI/CD設定
│   ├── monitoring.md                   # 監視・ログ
│   └── scaling.md                      # スケーリング戦略
└── operations/                         # 運用関連
    ├── launch-plan.md                  # ローンチ計画
    ├── maintenance.md                  # 保守・運用
    ├── troubleshooting.md              # トラブルシューティング
    └── legal-compliance.md             # 法的コンプライアンス
```
