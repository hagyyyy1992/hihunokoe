import { Page, expect } from '@playwright/test'
import { SKIN_TYPE_OPTIONS, GENDER_OPTIONS, ALLERGY_OPTIONS } from '@/lib/constants/profile'

export class ProfileHelper {
  constructor(private page: Page) {}

  async navigateToProfile() {
    await this.page.goto('/profile')
    await this.page.waitForLoadState('networkidle')
  }

  async clickEditButton() {
    await this.page.getByTestId('edit-profile-button').click()
    // 編集フォームが表示されるまで待機
    await this.page.waitForSelector('[data-testid="username-input"]', { state: 'visible' })
  }

  async fillProfileForm(data: {
    userName?: string
    skinType?: string
    birthDate?: string
    gender?: string
    allergies?: string[]
    allergiesOther?: string
  }) {
    if (data.userName !== undefined) {
      await this.page.getByTestId('username-input').fill(data.userName)
    }

    if (data.skinType !== undefined) {
      await this.page.getByTestId('skin-type-select').selectOption(data.skinType)
    }

    if (data.birthDate !== undefined) {
      await this.page.getByTestId('birth-date-input').fill(data.birthDate)
    }

    if (data.gender !== undefined) {
      await this.page.getByTestId('gender-select').selectOption(data.gender)
    }

    if (data.allergies) {
      // 複数選択のselect要素の操作
      await this.page.getByTestId('allergies-select').selectOption(data.allergies)
    }

    if (data.allergiesOther !== undefined && data.allergies?.includes('other')) {
      await this.page.getByTestId('allergies-other-input').fill(data.allergiesOther)
    }
  }

  async saveProfile() {
    await this.page.getByTestId('save-profile-button').click()
  }

  async cancelEdit() {
    await this.page.getByTestId('cancel-edit-button').click()
  }

  async expectSuccessMessage(message: string = 'プロフィールを更新しました') {
    const successAlert = this.page.locator('.bg-green-50').filter({ hasText: message })
    await expect(successAlert).toBeVisible({ timeout: 5000 })
  }

  async expectErrorMessage(message: string) {
    const errorAlert = this.page.locator('.bg-red-50').filter({ hasText: message })
    await expect(errorAlert).toBeVisible({ timeout: 5000 })
  }

  async expectProfileData(expectedData: {
    userName?: string
    email?: string
    skinType?: string
    birthDate?: string
    gender?: string
    allergies?: string[]
    allergiesOther?: string
  }) {
    // プロフィール表示モードになっていることを確認
    await expect(this.page.getByTestId('edit-profile-button')).toBeVisible()

    if (expectedData.userName) {
      await expect(this.page.locator('h2').filter({ hasText: expectedData.userName })).toBeVisible()
    }

    if (expectedData.email) {
      await expect(this.page.getByText(expectedData.email)).toBeVisible()
    }

    if (expectedData.skinType) {
      const skinTypeLabel = this.getSkinTypeLabel(expectedData.skinType)
      // バッジ内のテキストを確認（より具体的なセレクターを使用）
      await expect(this.page.locator('.badge').filter({ hasText: skinTypeLabel })).toBeVisible()
    }

    if (expectedData.birthDate) {
      const formattedDate = new Date(expectedData.birthDate).toLocaleDateString('ja-JP')
      await expect(this.page.getByText(formattedDate)).toBeVisible()
    }

    if (expectedData.gender) {
      const genderLabel = this.getGenderLabel(expectedData.gender)
      await expect(this.page.getByText(genderLabel)).toBeVisible()
    }

    if (expectedData.allergies && expectedData.allergies.length > 0) {
      for (const allergy of expectedData.allergies) {
        if (allergy !== 'other') {
          const allergyLabel = this.getAllergyLabel(allergy)
          await expect(this.page.getByText(allergyLabel)).toBeVisible()
        }
      }
    }

    if (expectedData.allergiesOther) {
      await expect(this.page.getByText(expectedData.allergiesOther)).toBeVisible()
    }
  }

  async expectFormValues(expectedData: {
    userName?: string
    skinType?: string
    birthDate?: string
    gender?: string
    allergies?: string[]
    allergiesOther?: string
  }) {
    if (expectedData.userName !== undefined) {
      await expect(this.page.getByTestId('username-input')).toHaveValue(expectedData.userName)
    }

    if (expectedData.skinType !== undefined) {
      await expect(this.page.getByTestId('skin-type-select')).toHaveValue(expectedData.skinType)
    }

    if (expectedData.birthDate !== undefined) {
      await expect(this.page.getByTestId('birth-date-input')).toHaveValue(expectedData.birthDate)
    }

    if (expectedData.gender !== undefined) {
      await expect(this.page.getByTestId('gender-select')).toHaveValue(expectedData.gender)
    }

    if (expectedData.allergies) {
      const selectedOptions = await this.page
        .getByTestId('allergies-select')
        .evaluate((select: HTMLSelectElement) => {
          return Array.from(select.selectedOptions).map(option => option.value)
        })
      expect(selectedOptions.sort()).toEqual(expectedData.allergies.sort())
    }

    if (expectedData.allergiesOther !== undefined && expectedData.allergies?.includes('other')) {
      await expect(this.page.getByTestId('allergies-other-input')).toHaveValue(
        expectedData.allergiesOther
      )
    }
  }

  async clickDeleteAccountButton() {
    await this.page.getByTestId('delete-account-button').click()
    await this.page.waitForURL('/account/delete')
  }

  private getSkinTypeLabel(value: string): string {
    const option = SKIN_TYPE_OPTIONS.find(opt => opt.value === value)
    return option ? option.label : ''
  }

  private getGenderLabel(value: string): string {
    const option = GENDER_OPTIONS.find(opt => opt.value === value)
    return option ? option.label : ''
  }

  private getAllergyLabel(value: string): string {
    return ALLERGY_OPTIONS[value as keyof typeof ALLERGY_OPTIONS] || value
  }
}
