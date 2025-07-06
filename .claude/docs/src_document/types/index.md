# types/index.ts

## 概要

アプリケーション全体で使用されるTypeScript型定義を一元管理するファイル。ドメインモデル、UI状態、APIレスポンスなどの型を定義しています。

## 主要な型定義

### 肌質関連

```typescript
export type SkinType = 'normal' | 'dry' | 'oily' | 'combination' | 'sensitive'
```

ユーザーの肌質を表現する5つのタイプ

### コスメカテゴリー

```typescript
export type CosmeticCategory =
  | 'toner' // 化粧水
  | 'serum' // 美容液
  | 'cream' // クリーム
// ... 他11カテゴリー
```

14種類のコスメカテゴリーを定義

### 使用シチュエーション

```typescript
export interface UsageSituation {
  season?: string[] // 季節
  timeOfDay?: string[] // 時間帯
  skinCondition?: string // 肌の状態
  specialCare?: string[] // 特別なケア
}
```

### 体験詳細

```typescript
export interface ExperienceDetails {
  fragrance?: FragranceStrength // 香りの強さ
  texture?: TextureType // テクスチャー
  afterUse?: AfterUseFeeling[] // 使用後の感覚
}
```

### 投稿関連

```typescript
export interface Post {
  id: string
  userId: string
  productName: string
  brandName: string
  category: CosmeticCategory
  content: string
  rating: number
  imageUrls?: string[]
  tags?: string[]
  usagePeriod?: string
  purchasePrice?: number
  repurchaseIntention?: boolean
  experienceDetails?: ExperienceDetails
  situation?: UsageSituation
  mood?: MoodTag
  isAnonymous: boolean
  createdAt: Date
  updatedAt: Date
  user?: User
  empathies?: Empathy[]
  _count?: {
    empathies: number
    comments: number
  }
}
```

### コメントシステム

```typescript
export interface Comment {
  id: string
  content: string
  postId: string
  userId: string
  parentId?: string
  createdAt: Date
  updatedAt: Date
  isEdited: boolean
  user?: User
  replies?: Comment[]
  _count?: {
    replies: number
  }
}
```

### 共感システム

```typescript
export type EmpathyType =
  | 'helpful' // 参考になった
  | 'same' // 同じ経験
  | 'interested' // 気になる
  | 'tried' // 使ってみたい
```

### 権限とステータス

```typescript
export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN'
export type PostStatus = 'draft' | 'published' | 'hidden'
```

## 型の使用方法

### インポート例

```typescript
import { Post, User, Comment, SkinType } from '@/types'
```

### 型ガード関数

```typescript
// 例: 投稿が公開されているかチェック
function isPublishedPost(post: Post): boolean {
  return post.status === 'published'
}
```

## 設計指針

1. **単一責任**: 各型は明確な目的を持つ
2. **拡張性**: オプショナルプロパティで柔軟性を確保
3. **型安全性**: strictモードでの完全な型チェック
4. **再利用性**: 共通の型を抽出して重複を避ける

## 関連ファイル

- Prismaスキーマ（`prisma/schema.prisma`）と連携
- APIレスポンスの型として使用
- コンポーネントのprops定義で活用
