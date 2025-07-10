import { NextRequest, NextResponse } from 'next/server'
import { TokenServiceImpl } from '@api/interface-adapters/services/TokenServiceImpl'
import { IProfileUseCase } from '@api/usecases/profile/input-port'

export class ProfileController {
  private tokenService: TokenServiceImpl
  private profileUseCase: IProfileUseCase

  constructor(profileUseCase: IProfileUseCase) {
    this.tokenService = new TokenServiceImpl()
    this.profileUseCase = profileUseCase
  }

  private async getUserIdFromRequest(request: NextRequest): Promise<string | null> {
    const authHeader = request.headers.get('Authorization')
    let token = authHeader?.replace('Bearer ', '')
    if (!token) token = request.cookies.get('auth-token')?.value
    if (!token) return null
    return await this.tokenService.verifyAuthToken(token)
  }

  async updateProfile(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getUserIdFromRequest(request)
      if (!userId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
      const body = await request.json()
      console.log('Profile update request body:', body)
      const { userName, skinType, birthDate, gender, allergies, allergiesOther, profileImageUrl } =
        body
      const result = await this.profileUseCase.updateProfile({
        userId,
        userName,
        skinType,
        birthDate,
        gender,
        allergies,
        allergiesOther,
        profileImageUrl,
      })
      return NextResponse.json({
        message: result.message,
        user: {
          id: result.user.id,
          userName: result.user.userName,
          email: result.user.email,
          role: result.user.role,
          birthDate: result.user.birthDate,
          gender: result.user.gender,
          skinType: result.user.skinType,
          skinTypeOther: result.user.skinTypeOther,
          allergies: result.user.allergies,
          allergiesOther: result.user.allergiesOther,
          emailVerified: result.user.emailVerified,
        },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found' || error.message === 'User account is inactive') {
          return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
        }
        if (
          error.message.includes('ユーザー名') ||
          error.message.includes('生年月日') ||
          error.message.includes('プロフィール画像URL') ||
          error.message.includes('使用されています')
        ) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
      }
      console.error('Profile update error:', error)
      return NextResponse.json({ error: 'プロフィールの更新に失敗しました' }, { status: 500 })
    }
  }

  async getProfile(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = await this.getUserIdFromRequest(request)
      if (!userId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
      const result = await this.profileUseCase.getProfile({ userId })
      return NextResponse.json({
        success: true,
        user: {
          id: result.user.id,
          userName: result.user.userName,
          email: result.user.email,
          role: result.user.role,
          birthDate: result.user.birthDate,
          gender: result.user.gender,
          skinType: result.user.skinType,
          skinTypeOther: result.user.skinTypeOther,
          allergies: result.user.allergies,
          allergiesOther: result.user.allergiesOther,
          emailVerified: result.user.emailVerified,
          createdAt: result.user.createdAt,
          updatedAt: result.user.updatedAt,
        },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found' || error.message === 'User account is inactive') {
          return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
        }
      }
      console.error('Get profile error:', error)
      return NextResponse.json({ error: 'プロフィールの取得に失敗しました' }, { status: 500 })
    }
  }
}
