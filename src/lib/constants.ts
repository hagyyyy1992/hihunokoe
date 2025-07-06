export const SERVICE_NAME = 'ひふのこえ'
export const SERVICE_TAGLINE = '化粧品体験共有コミュニティ'
export const SERVICE_FULL_TITLE = `${SERVICE_NAME} - ${SERVICE_TAGLINE}`

// 体験詳細のラベル定義
export const fragranceTypeLabels: Record<string, string> = {
  none: '無香料',
  floral: 'フローラル系',
  citrus: 'シトラス系',
  herbal: 'ハーブ系',
  chemical: '化学的な香り',
  other: 'その他',
}

export const fragranceIntensityLabels: Record<string, string> = {
  weak: '弱い',
  moderate: '普通',
  strong: '強い',
}

export const textureTypeLabels: Record<string, string> = {
  watery: '水のような',
  gel: 'ジェル状',
  cream: 'クリーム状',
  oil: 'オイル状',
  powder: 'パウダー状',
  other: 'その他',
}

export const spreadabilityLabels: Record<string, string> = {
  easy: 'よく伸びる',
  moderate: '普通',
  difficult: '伸びにくい',
}

export const absorptionLabels: Record<string, string> = {
  fast: '早い',
  moderate: '普通',
  slow: '遅い',
}

export const moistureLabels: Record<string, string> = {
  very_dry: 'とても乾燥',
  dry: '乾燥',
  normal: '普通',
  moist: 'しっとり',
  very_moist: 'とてもしっとり',
}

export const textureAfterUseLabels: Record<string, string> = {
  rough: 'ざらざら',
  normal: '普通',
  smooth: 'なめらか',
  very_smooth: 'とてもなめらか',
}

export const comfortLabels: Record<string, string> = {
  uncomfortable: '不快',
  normal: '普通',
  comfortable: '快適',
  very_comfortable: 'とても快適',
}
