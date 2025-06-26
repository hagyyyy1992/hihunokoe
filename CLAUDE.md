# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Usaka is a cosmetics experience sharing service built with Next.js 15 and TypeScript. The application allows users to share authentic cosmetic experiences and discover products that might suit their skin type and preferences.

## Architecture

### Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + bcrypt with email verification
- **Email**: Resend (production) / MailHog (development)
- **Deployment**: Vercel

### Database Configuration

The application uses a flexible database configuration system (`src/lib/db-config.ts`) that supports:

- **Local development**: Docker PostgreSQL container
- **Production**: Supabase
- **Mock mode**: In-memory demo data when database is unavailable

### Key Files

- `src/lib/auth/auth.ts` - Authentication logic with dual mode (database/mock)
- `src/lib/prisma.ts` - Database client initialization
- `prisma/schema.prisma` - Database schema with User, Post, Empathy, Comment models
- `src/lib/mock-data.ts` - Demo data for offline development

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

### Email Testing

```bash
# Start MailHog for email testing
npm run mailhog:start

# Stop MailHog
npm run mailhog:stop
```

## Code Conventions

### Authentication

- Use `src/lib/auth/auth.ts` for all authentication operations
- Authentication automatically falls back to mock users when database is unavailable
- Email verification is currently skipped in development (`emailVerified: true`)

### Database Operations

- Always check `isDatabaseAvailable()` before database operations
- Use the dual-mode pattern: try database first, fallback to mock data
- All database models use UUID primary keys

### Component Structure

- UI components in `src/components/ui/`
- Form components in `src/components/forms/`
- Layout components in `src/components/layout/`
- Follow existing naming conventions and prop patterns

### API Routes

- All API routes follow Next.js App Router conventions
- Use proper error handling and status codes
- Authentication routes in `src/app/api/auth/`
- Post-related routes in `src/app/api/posts/`

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

## Important Notes

### Environment Variables

- Development environment is pre-configured
- Production requires `RESEND_API_KEY` for email functionality
- Database URLs are managed by `db-config.ts`

### Mock Data

- Demo users available for testing (password: `demo123`)
- Mock mode enables offline development
- Controlled by `USE_MOCK_DATA` environment variable

### Email System

- Email verification system is implemented but temporarily disabled
- MailHog runs on http://localhost:8025 for testing
- Production uses Resend API

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
