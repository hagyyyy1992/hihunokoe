# システムアーキテクチャ

## 全体構成

### アーキテクチャ概要
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Browser   │────│  Vercel Edge     │────│  Next.js App    │
│   (Client)       │    │  CDN & Compute   │    │  (Frontend)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         │ API Routes
                                                         ▼
                                                ┌─────────────────┐
                                                │   Supabase      │
                                                │  (Backend)      │
                                                │ ─────────────── │
                                                │ • PostgreSQL   │
                                                │ • Auth          │
                                                │ • Storage       │
                                                │ • Functions     │
                                                └─────────────────┘
```

### 技術スタック

#### フロントエンド層
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **State Management**: React Context API
- **Form Handling**: React Hook Form + Zod
- **HTTP Client**: Fetch API

#### バックエンド層
- **Database**: Supabase PostgreSQL
- **ORM**: Prisma 6
- **Authentication**: JWT + bcrypt
- **File Storage**: Supabase Storage
- **Email**: Supabase Auth (将来実装)

#### インフラ層
- **Hosting**: Vercel
- **CDN**: Vercel Edge Network
- **DNS**: Vercel Domains
- **SSL**: Vercel 自動SSL証明書
- **Analytics**: Vercel Analytics

## デプロイメント環境

### 環境構成
```
Production Environment (main branch)
├── Domain: usaka.vercel.app
├── Database: Supabase Production
├── Analytics: Vercel Analytics
└── Monitoring: Vercel Monitoring

Staging Environment (preview branches)
├── Domain: [branch-name]-usaka.vercel.app
├── Database: Supabase Staging (将来分離)
├── Analytics: Disabled
└── Monitoring: Limited

Development Environment (local)
├── URL: localhost:3000
├── Database: Local SQLite / Supabase Dev
├── Hot Reload: Turbopack
└── Debug Tools: Next.js DevTools
```

### CI/CD パイプライン
```
GitHub Repository
│
├── Pull Request作成
│   ├── Vercel Preview Deploy
│   ├── TypeScript Check
│   ├── ESLint Check
│   └── Build Verification
│
└── Main Branch Merge
    ├── Vercel Production Deploy
    ├── Database Migration (if needed)
    ├── Performance Check
    └── Monitoring Alert Setup
```

## ネットワーク構成

### CDN・エッジ配信
- **Global CDN**: Vercel Edge Network
- **Cache Strategy**: Static Assets (永続), API Routes (短時間)
- **Compression**: Brotli, Gzip自動適用
- **HTTP/2**: Push, Multiplexing対応

### セキュリティ
- **HTTPS**: 強制リダイレクト
- **HSTS**: 有効
- **CSP**: Content Security Policy設定
- **CORS**: 適切なオリジン制限

## データベース構成

### Supabase PostgreSQL
- **Version**: PostgreSQL 15
- **Connection Pooling**: pgBouncer
- **Backup**: 自動日次バックアップ
- **Replication**: リードレプリカ（将来実装）

### 接続管理
```typescript
// Connection Pool Configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
)
```

### データ同期
- **Real-time**: Supabase Realtime（将来実装）
- **Cache**: Next.js ISR + SWR
- **Offline**: Service Worker（将来実装）

## スケーリング戦略

### 水平スケーリング
- **Frontend**: Vercel Serverless Functions自動スケール
- **Database**: Supabase接続プール + Read Replica
- **Storage**: Supabase Storage自動スケール

### パフォーマンス最適化
```
Frontend Optimization
├── Static Generation (SSG)
├── Incremental Static Regeneration (ISR)
├── Image Optimization (Next.js Image)
├── Code Splitting (Automatic)
└── Tree Shaking (Webpack)

Backend Optimization
├── Query Optimization (Prisma)
├── Index Optimization (PostgreSQL)
├── Connection Pooling (pgBouncer)
└── Caching Strategy (Redis - 将来実装)
```

## 監視・ログ

### アプリケーション監視
- **Performance**: Vercel Analytics
- **Errors**: Vercel Error Tracking
- **Uptime**: Vercel Status
- **Custom Metrics**: Vercel Functions Metrics

### データベース監視
- **Performance**: Supabase Dashboard
- **Query Analysis**: Supabase Performance Insights
- **Connection Monitoring**: pgBouncer Stats
- **Storage Usage**: Supabase Storage Metrics

### ログ管理
```
Log Aggregation
├── Application Logs: Vercel Functions Logs
├── Access Logs: Vercel Edge Logs
├── Database Logs: Supabase Logs
└── Error Tracking: Console.error + Vercel
```

## セキュリティアーキテクチャ

### 認証・認可
```
Authentication Flow
├── JWT Token Generation (Server-side)
├── HTTP-only Cookie Storage
├── Automatic Token Refresh
└── Role-based Access Control (RBAC)

Authorization Layers
├── Route Protection (Middleware)
├── API Route Guards
├── Database RLS (Row Level Security)
└── Component-level Access Control
```

### データ保護
- **Encryption at Rest**: Supabase自動暗号化
- **Encryption in Transit**: TLS 1.3
- **Password Hashing**: bcrypt (cost factor: 12)
- **SQL Injection**: Prisma ORM保護

### セキュリティヘッダー
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'"
  }
]
```

## 災害復旧・事業継続

### バックアップ戦略
- **Code**: GitHub Repository
- **Database**: Supabase自動バックアップ（日次）
- **Assets**: Vercel自動バックアップ
- **Configuration**: Environment Variables

### 復旧手順
```
Disaster Recovery Process
├── Impact Assessment (5 minutes)
├── Rollback Decision (10 minutes)
├── Rollback Execution (30 minutes)
└── Service Verification (15 minutes)

Total RTO: 60 minutes
Total RPO: 24 hours (last backup)
```

## パフォーマンス目標

### フロントエンド性能
- **First Contentful Paint**: < 1.5秒
- **Largest Contentful Paint**: < 2.5秒
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### バックエンド性能
- **API Response Time**: < 500ms (95%ile)
- **Database Query Time**: < 100ms (95%ile)
- **Page Load Time**: < 3秒
- **Uptime**: > 99.5%

## 将来の拡張計画

### スケールアウト
```
Phase 1: Current (MVP)
├── Vercel Hobby Plan
├── Supabase Starter Plan
└── ~1,000 MAU

Phase 2: Growth (6 months)
├── Vercel Pro Plan
├── Supabase Pro Plan
├── Redis Cache Layer
└── ~10,000 MAU

Phase 3: Scale (12 months)
├── Vercel Enterprise
├── Supabase Enterprise
├── Multi-region Deployment
├── Microservices Architecture
└── ~100,000 MAU
```

### 技術進化
- **AI/ML**: おすすめ機能（Vercel AI SDK）
- **Real-time**: コメント・通知（Supabase Realtime）
- **Mobile**: React Native アプリ
- **Analytics**: カスタムダッシュボード

## コスト最適化

### 料金構造
```
Current Monthly Cost (estimated)
├── Vercel Hobby: $0
├── Supabase Starter: $25
├── Domain: $20/year
└── Total: ~$27/month

Projected Cost at 10K MAU
├── Vercel Pro: $20
├── Supabase Pro: $25
├── Additional Services: $50
└── Total: ~$95/month
```

### 最適化戦略
- **Static Generation**: サーバーレス関数使用量削減
- **Image Optimization**: 帯域幅使用量削減
- **Database**: 効率的なクエリ設計
- **CDN**: 適切なキャッシュ戦略