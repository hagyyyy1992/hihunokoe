export const SKIN_TYPE_OPTIONS = [
  { value: '', label: '選択してください' },
  { value: 'normal', label: '普通肌' },
  { value: 'dry', label: '乾燥肌' },
  { value: 'oily', label: '脂性肌' },
  { value: 'combination', label: '混合肌' },
  { value: 'sensitive', label: '敏感肌' },
] as const

export const GENDER_OPTIONS = [
  { value: '', label: '選択してください' },
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
] as const

export const ALLERGY_OPTIONS = {
  fragrance: '香料',
  alcohol: 'アルコール',
  paraben: 'パラベン',
  sulfate: '硫酸塩',
  silicone: 'シリコン',
  mineral_oil: 'ミネラルオイル',
  formaldehyde: 'ホルムアルデヒド',
  latex: 'ラテックス',
  nickel: 'ニッケル',
  other: 'その他',
} as const

export const SKIN_CONDITION_OPTIONS = [
  { value: '', label: '選択してください' },
  { value: 'stable', label: '安定' },
  { value: 'unstable', label: '不安定' },
  { value: 'trouble', label: 'トラブルあり' },
] as const

// Helper functions to get labels
export const getSkinTypeLabel = (skinType?: string): string => {
  const option = SKIN_TYPE_OPTIONS.find(opt => opt.value === skinType)
  return option ? option.label : '-'
}

export const getSkinConditionLabel = (condition?: string): string => {
  const option = SKIN_CONDITION_OPTIONS.find(opt => opt.value === condition)
  return option ? option.label : '-'
}

export type SkinType = Exclude<(typeof SKIN_TYPE_OPTIONS)[number]['value'], ''>
export type SkinCondition = Exclude<(typeof SKIN_CONDITION_OPTIONS)[number]['value'], ''>
export type Gender = keyof typeof GENDER_OPTIONS
export type AllergyType = keyof typeof ALLERGY_OPTIONS
