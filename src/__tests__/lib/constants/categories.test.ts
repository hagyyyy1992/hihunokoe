import {
  categoryLabels,
  skincareCategories,
  categoryKeys,
  isValidCategory,
  getCategoryLabel,
  isSkincareCategory,
} from '@/lib/constants/categories'

describe('カテゴリー定数', () => {
  describe('categoryLabels', () => {
    test('すべての必須カテゴリーが定義されている', () => {
      const expectedCategories = [
        'skincare',
        'toner',
        'serum',
        'emulsion',
        'cream',
        'cleanser',
        'foundation',
        'concealer',
        'powder',
        'eyeshadow',
        'lipstick',
        'sunscreen',
        'other',
      ]

      expectedCategories.forEach(category => {
        expect(categoryLabels).toHaveProperty(category)
        expect(typeof categoryLabels[category]).toBe('string')
        expect(categoryLabels[category].length).toBeGreaterThan(0)
      })
    })

    test('日本語ラベルが正しく設定されている', () => {
      expect(categoryLabels.skincare).toBe('スキンケア')
      expect(categoryLabels.toner).toBe('化粧水')
      expect(categoryLabels.serum).toBe('美容液')
      expect(categoryLabels.emulsion).toBe('乳液')
      expect(categoryLabels.cream).toBe('クリーム')
      expect(categoryLabels.cleanser).toBe('洗顔')
      expect(categoryLabels.foundation).toBe('ファンデーション')
      expect(categoryLabels.concealer).toBe('コンシーラー')
      expect(categoryLabels.powder).toBe('フェイスパウダー')
      expect(categoryLabels.eyeshadow).toBe('アイシャドウ')
      expect(categoryLabels.lipstick).toBe('リップ')
      expect(categoryLabels.sunscreen).toBe('日焼け止め')
      expect(categoryLabels.other).toBe('その他')
    })
  })

  describe('skincareCategories', () => {
    test('正しいスキンケアカテゴリーが含まれている', () => {
      const expectedSkincareCategories = [
        'skincare',
        'toner',
        'serum',
        'emulsion',
        'cream',
        'cleanser',
        'sunscreen',
      ]

      expect(skincareCategories).toEqual(expectedSkincareCategories)
    })

    test('メイクアップカテゴリーが含まれていない', () => {
      const makeupCategories = ['foundation', 'concealer', 'powder', 'eyeshadow', 'lipstick']

      makeupCategories.forEach(category => {
        expect(skincareCategories).not.toContain(category)
      })
    })
  })

  describe('categoryKeys', () => {
    test('すべてのカテゴリーキーが取得できる', () => {
      expect(categoryKeys).toContain('skincare')
      expect(categoryKeys).toContain('toner')
      expect(categoryKeys).toContain('other')
      expect(categoryKeys.length).toBe(Object.keys(categoryLabels).length)
    })
  })

  describe('isValidCategory', () => {
    test('有効なカテゴリーを正しく判定する', () => {
      expect(isValidCategory('toner')).toBe(true)
      expect(isValidCategory('serum')).toBe(true)
      expect(isValidCategory('foundation')).toBe(true)
    })

    test('無効なカテゴリーを正しく判定する', () => {
      expect(isValidCategory('invalid')).toBe(false)
      expect(isValidCategory('')).toBe(false)
      expect(isValidCategory('makeup')).toBe(false)
    })
  })

  describe('getCategoryLabel', () => {
    test('有効なカテゴリーのラベルを取得する', () => {
      expect(getCategoryLabel('toner')).toBe('化粧水')
      expect(getCategoryLabel('foundation')).toBe('ファンデーション')
    })

    test('無効なカテゴリーの場合は元の値を返す', () => {
      expect(getCategoryLabel('invalid')).toBe('invalid')
      expect(getCategoryLabel('')).toBe('')
    })
  })

  describe('isSkincareCategory', () => {
    test('スキンケアカテゴリーを正しく判定する', () => {
      expect(isSkincareCategory('toner')).toBe(true)
      expect(isSkincareCategory('serum')).toBe(true)
      expect(isSkincareCategory('cleanser')).toBe(true)
      expect(isSkincareCategory('sunscreen')).toBe(true)
    })

    test('メイクアップカテゴリーを正しく判定する', () => {
      expect(isSkincareCategory('foundation')).toBe(false)
      expect(isSkincareCategory('lipstick')).toBe(false)
      expect(isSkincareCategory('eyeshadow')).toBe(false)
    })

    test('その他のカテゴリーを正しく判定する', () => {
      expect(isSkincareCategory('other')).toBe(false)
      expect(isSkincareCategory('invalid')).toBe(false)
    })
  })
})
