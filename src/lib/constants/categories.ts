export const categoryLabels: Record<string, string> = {
  skincare: 'スキンケア',
  toner: '化粧水',
  serum: '美容液',
  emulsion: '乳液',
  cream: 'クリーム',
  cleanser: '洗顔',
  foundation: 'ファンデーション',
  concealer: 'コンシーラー',
  powder: 'フェイスパウダー',
  eyeshadow: 'アイシャドウ',
  lipstick: 'リップ',
  sunscreen: '日焼け止め',
  other: 'その他',
}

// スキンケアカテゴリの定義
export const skincareCategories = [
  'skincare',
  'toner',
  'serum',
  'emulsion',
  'cream',
  'cleanser',
  'sunscreen',
]

// カテゴリのキーを取得（型安全）
export const categoryKeys = Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>

// カテゴリが有効かチェック
export const isValidCategory = (category: string): boolean => {
  return category in categoryLabels
}

// カテゴリラベルを取得（存在しない場合はそのまま返す）
export const getCategoryLabel = (category: string): string => {
  return categoryLabels[category] || category
}

// スキンケアカテゴリかチェック
export const isSkincareCategory = (category: string): boolean => {
  return skincareCategories.includes(category)
}
