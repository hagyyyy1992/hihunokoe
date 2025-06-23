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

## Development Workflow

1. **Start development**: `npm run dev:setup` (first time) or `npm run dev`
2. **Database changes**: Update schema → `npm run db:migrate` → `npm run db:seed`
3. **Email testing**: Use MailHog web interface at http://localhost:8025
4. **Code quality**: Run `npm run lint` and `npm run format` before committing

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
