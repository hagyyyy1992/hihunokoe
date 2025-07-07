import { User } from '@api/domain/entities/User'
import { UserRepository } from '@api/domain/repositories/UserRepository'

export interface UpdateProfileInputData {
  userId: string
  userName?: string
  skinType?: string | null
  birthDate?: string | null
  gender?: string | null
  allergies?: string[] | null
  allergiesOther?: string | null
  profileImageUrl?: string | null
}

export interface UpdateProfileOutputData {
  user: User
  message: string
}

export class UpdateProfileUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(inputData: UpdateProfileInputData): Promise<UpdateProfileOutputData> {
    const {
      userId,
      userName,
      skinType,
      birthDate,
      gender,
      allergies,
      allergiesOther,
      profileImageUrl,
    } = inputData

    // Validate user exists and is active
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    if (!user.isActive || user.deletedAt) {
      throw new Error('User account is inactive')
    }

    // Validate userName if provided
    if (userName !== undefined) {
      if (!userName || userName.trim().length < 3) {
        throw new Error('ユーザー名は3文字以上である必要があります')
      }
      if (userName.trim().length > 50) {
        throw new Error('ユーザー名は50文字以下である必要があります')
      }

      // Check if userName already exists (excluding current user)
      const existingUser = await this.userRepository.findByUsername(userName.trim())
      if (existingUser && existingUser.id !== userId) {
        throw new Error('このユーザー名は既に使用されています')
      }
    }

    // Validate birthDate if provided
    if (birthDate !== undefined && birthDate !== null) {
      const date = new Date(birthDate)
      if (isNaN(date.getTime())) {
        throw new Error('無効な生年月日です')
      }

      const now = new Date()
      const age = now.getFullYear() - date.getFullYear()
      if (age < 0 || age > 150) {
        throw new Error('生年月日が無効です')
      }
    }

    // Validate profileImageUrl if provided
    if (profileImageUrl !== undefined && profileImageUrl !== null) {
      if (!profileImageUrl.startsWith('http://') && !profileImageUrl.startsWith('https://')) {
        throw new Error('プロフィール画像URLはhttp://またはhttps://で始まる必要があります')
      }
    }

    // Build update data
    const updateData: any = {}
    if (userName !== undefined) updateData.username = userName.trim()
    if (skinType !== undefined) updateData.skinType = skinType
    if (birthDate !== undefined) updateData.birthDate = birthDate ? new Date(birthDate) : null
    if (gender !== undefined) updateData.gender = gender
    if (allergies !== undefined) updateData.allergies = allergies
    if (allergiesOther !== undefined) updateData.allergiesOther = allergiesOther
    if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl

    // Update user profile
    const updatedUser = await this.userRepository.update(userId, updateData)

    return {
      user: updatedUser,
      message: 'プロフィールを更新しました',
    }
  }
}
