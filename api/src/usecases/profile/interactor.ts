import { IUserRepository } from '@api/domain/repositories/UserRepository'
import {
  GetProfileInputPort,
  IProfileUseCase,
  UpdateProfileInputPort,
} from '@api/usecases/profile/input-port'
import { GetProfileOutputPort, UpdateProfileOutputPort } from '@api/usecases/profile/output-port'

export class GetProfileUseCase implements IProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async getProfile(inputData: GetProfileInputPort): Promise<GetProfileOutputPort> {
    const { userId } = inputData
    const user = await this.userRepository.findById(userId)
    if (!user) throw new Error('User not found')
    if (!user.isActive || user.deletedAt) throw new Error('User account is inactive')
    return { user }
  }

  async updateProfile(inputData: UpdateProfileInputPort): Promise<UpdateProfileOutputPort> {
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
    const user = await this.userRepository.findById(userId)
    if (!user) throw new Error('User not found')
    if (!user.isActive || user.deletedAt) throw new Error('User account is inactive')
    if (userName !== undefined) {
      if (!userName || userName.trim().length < 3) {
        throw new Error('ユーザー名は3文字以上である必要があります')
      }
      if (userName.trim().length > 50) {
        throw new Error('ユーザー名は50文字以下である必要があります')
      }
      const existingUser = await this.userRepository.findByUsername(userName.trim())
      if (existingUser && existingUser.id !== userId) {
        throw new Error('このユーザー名は既に使用されています')
      }
    }
    if (birthDate !== undefined && birthDate !== null) {
      const date = new Date(birthDate)
      if (isNaN(date.getTime())) throw new Error('無効な生年月日です')
      const now = new Date()
      const age = now.getFullYear() - date.getFullYear()
      if (age < 0 || age > 150) throw new Error('生年月日が無効です')
    }
    if (profileImageUrl !== undefined && profileImageUrl !== null) {
      if (!profileImageUrl.startsWith('http://') && !profileImageUrl.startsWith('https://')) {
        throw new Error('プロフィール画像URLはhttp://またはhttps://で始まる必要があります')
      }
    }
    const updateData: any = {}
    if (userName !== undefined) updateData.userName = userName.trim() // username → userName に修正
    if (skinType !== undefined) updateData.skinType = skinType
    if (birthDate !== undefined) updateData.birthDate = birthDate ? new Date(birthDate) : null
    if (gender !== undefined) updateData.gender = gender
    if (allergies !== undefined) updateData.allergies = allergies
    if (allergiesOther !== undefined) updateData.allergiesOther = allergiesOther
    if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl
    const updatedUser = await this.userRepository.update(userId, updateData)
    return { user: updatedUser, message: 'プロフィールを更新しました' }
  }
}
