// E2Eテスト用の定数定義

import { categoryLabels } from '../../src/lib/constants/categories'

// 化粧品カテゴリのマッピング
export const COSMETIC_CATEGORY_VALUES = Object.keys(categoryLabels).reduce(
  (acc, key) => {
    acc[key as keyof typeof categoryLabels] = key
    return acc
  },
  {} as Record<keyof typeof categoryLabels, string>
)

// UIに表示される日本語ラベル（共通定数から参照）
export const COSMETIC_CATEGORY_LABELS = categoryLabels

// 肌タイプの値
export const SKIN_TYPE_VALUES = {
  normal: 'normal',
  dry: 'dry',
  oily: 'oily',
  combination: 'combination',
  sensitive: 'sensitive',
} as const

// ムードタグの値
export const MOOD_TAG_VALUES = {
  love: 'love',
  good: 'good',
  okay: 'okay',
  disappointed: 'disappointed',
} as const
