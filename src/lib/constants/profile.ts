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

export type SkinType = Exclude<(typeof SKIN_TYPE_OPTIONS)[number]['value'], ''>
export type Gender = keyof typeof GENDER_OPTIONS
export type AllergyType = keyof typeof ALLERGY_OPTIONS
