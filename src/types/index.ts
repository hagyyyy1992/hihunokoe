// 肌タイプの型定義
export type SkinType =
  | 'NORMAL' // 普通肌
  | 'DRY' // 乾燥肌
  | 'OILY' // 脂性肌
  | 'MIXED' // 混合肌
  | 'SENSITIVE' // 敏感肌
  | 'OTHER' // その他

// 性別の型定義
export type Gender =
  | 'MALE' // 男性
  | 'FEMALE' // 女性
  | 'OTHER' // その他
  | 'NO_ANSWER' // 回答しない

// 体型の型定義
export type BodyType =
  | 'SLIM' // スリム
  | 'AVERAGE' // 普通
  | 'PLUMP' // ぽっちゃり
  | 'OTHER' // その他

// アレルギータイプの型定義
export type AllergyType =
  | 'POLLEN' // 花粉
  | 'DUST' // ホコリ
  | 'FOOD' // 食べ物
  | 'METAL' // 金属
  | 'COSMETICS' // 化粧品
  | 'CHEMICALS' // 化学物質
  | 'ANIMALS' // 動物
  | 'MEDICATIONS' // 薬

// コスメカテゴリの型定義
export type CosmeticCategory =
  | 'toner' // 化粧水
  | 'serum' // 美容液
  | 'emulsion' // 乳液
  | 'cream' // クリーム
  | 'cleanser' // 洗顔
  | 'foundation' // ファンデーション
  | 'concealer' // コンシーラー
  | 'powder' // フェイスパウダー
  | 'eyeshadow' // アイシャドウ
  | 'lipstick' // リップ
  | 'sunscreen' // 日焼け止め
  | 'other' // その他

// 使用状況の型定義
export interface UsageSituation {
  season?: 'spring' | 'summer' | 'autumn' | 'winter'
  timeOfDay?: 'morning' | 'evening' | 'both'
  menstrualCycle?: 'before' | 'during' | 'after' | 'none'
  skinCondition?: 'good' | 'unstable' | 'problematic'
  weatherCondition?: 'humid' | 'dry' | 'hot' | 'cold' | 'normal'
}

// 体験詳細の型定義
export interface ExperienceDetails {
  fragrance?: {
    type: 'none' | 'floral' | 'citrus' | 'herbal' | 'chemical' | 'other'
    intensity: 'weak' | 'moderate' | 'strong'
    description?: string
  }
  texture?: {
    type: 'watery' | 'gel' | 'cream' | 'oil' | 'powder' | 'other'
    spreadability: 'easy' | 'moderate' | 'difficult'
    absorption: 'fast' | 'moderate' | 'slow'
    description?: string
  }
  afterUse?: {
    moisture: 'very_dry' | 'dry' | 'normal' | 'moist' | 'very_moist'
    texture: 'rough' | 'normal' | 'smooth' | 'very_smooth'
    comfort: 'uncomfortable' | 'normal' | 'comfortable' | 'very_comfortable'
    duration: 'short' | 'moderate' | 'long'
    description?: string
  }
}

// 投稿の雰囲気タグ
export type MoodTag =
  | 'disappointed' // ちょっと残念
  | 'okay' // まあまあ
  | 'good' // 良かった
  | 'love' // また使いたい
  | 'perfect' // 完璧

// 共感タイプ
export type EmpathyType =
  | 'LIKE' // いいね
  | 'LOVE' // 大好き
  | 'HELPFUL' // 参考になった
  | 'AMAZING' // すごい

// 投稿ステータス
export type PostStatus = 'draft' | 'published' | 'archived'

// 権限タイプ
export type PermissionType = 'view' | 'edit' | 'delete'

// コメント関連の型定義
export interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    userName: string
    skinType?: string
    profileImageUrl?: string
  }
  replies?: Comment[]
  isEdited: boolean
  canEdit: boolean
  canDelete: boolean
}

export interface CommentFormData {
  content: string
}

export interface CommentsPagination {
  page: number
  limit: number
  total: number
  hasMore: boolean
}
