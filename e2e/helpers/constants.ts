// E2Eテスト用の定数定義

// 化粧品カテゴリのマッピング
export const COSMETIC_CATEGORY_VALUES = {
  toner: 'toner',
  serum: 'serum',
  emulsion: 'emulsion',
  cream: 'cream',
  cleanser: 'cleanser',
  foundation: 'foundation',
  concealer: 'concealer',
  sunscreen: 'sunscreen',
  other: 'other',
} as const

// UIに表示される日本語ラベル
export const COSMETIC_CATEGORY_LABELS = {
  toner: '化粧水',
  serum: '美容液',
  emulsion: '乳液',
  cream: 'クリーム',
  cleanser: '洗顔',
  foundation: 'ファンデーション',
  concealer: 'コンシーラー',
  sunscreen: '日焼け止め',
  other: 'その他',
} as const

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
