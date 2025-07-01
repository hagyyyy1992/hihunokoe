import { deleteUserAccount } from '@/lib/auth/auth'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'

// モック
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
  isDatabaseAvailable: jest.fn(),
}))

const mockIsDatabaseAvailable = isDatabaseAvailable as jest.MockedFunction<
  typeof isDatabaseAvailable
>
const mockPrismaUser = (prisma as any).user

describe('deleteUserAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the mocked prisma user object
    mockPrismaUser.findUnique.mockReset()
    mockPrismaUser.update.mockReset()
  })

  it('データベースが利用できない場合はエラーを投げる', async () => {
    mockIsDatabaseAvailable.mockReturnValue(false)

    await expect(deleteUserAccount('user-1')).rejects.toThrow(
      'アカウント削除はモックモードではサポートされていません'
    )
  })

  it('無効なUUIDの場合はエラーを投げる', async () => {
    mockIsDatabaseAvailable.mockReturnValue(true)

    await expect(deleteUserAccount('invalid-uuid')).rejects.toThrow(
      'アカウント削除はモックモードではサポートされていません'
    )
  })

  it('ユーザーが存在しない場合はエラーを投げる', async () => {
    mockIsDatabaseAvailable.mockReturnValue(true)
    mockPrismaUser.findUnique.mockResolvedValue(null)

    const validUuid = '550e8400-e29b-41d4-a716-446655440000'

    // コンソールエラーをモック
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    await expect(deleteUserAccount(validUuid)).rejects.toThrow('ユーザーが見つかりません')

    expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
      where: { id: validUuid, isActive: true },
    })
    expect(mockPrismaUser.update).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('非アクティブなユーザーの場合はエラーを投げる', async () => {
    mockIsDatabaseAvailable.mockReturnValue(true)
    mockPrismaUser.findUnique.mockResolvedValue(null) // isActive: trueで検索するため見つからない

    const validUuid = '550e8400-e29b-41d4-a716-446655440000'

    // コンソールエラーをモック
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    await expect(deleteUserAccount(validUuid)).rejects.toThrow('ユーザーが見つかりません')

    consoleSpy.mockRestore()
  })

  it('正常なユーザーIDでアカウント論理削除が成功する', async () => {
    mockIsDatabaseAvailable.mockReturnValue(true)

    const activeUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userName: 'testuser',
      email: 'test@example.com',
      isActive: true,
      deletedAt: null,
    }

    mockPrismaUser.findUnique.mockResolvedValue(activeUser)
    mockPrismaUser.update.mockResolvedValue({
      ...activeUser,
      deletedAt: new Date(),
      isActive: false,
    })

    const validUuid = '550e8400-e29b-41d4-a716-446655440000'
    const result = await deleteUserAccount(validUuid)

    expect(result).toBe(true)
    expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
      where: { id: validUuid, isActive: true },
    })
    expect(mockPrismaUser.update).toHaveBeenCalledWith({
      where: { id: validUuid },
      data: {
        deletedAt: expect.any(Date),
        isActive: false,
      },
    })
  })

  it('Prismaエラーが発生した場合は汎用エラーメッセージを投げる', async () => {
    mockIsDatabaseAvailable.mockReturnValue(true)

    const activeUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userName: 'testuser',
      email: 'test@example.com',
      isActive: true,
      deletedAt: null,
    }

    mockPrismaUser.findUnique.mockResolvedValue(activeUser)
    mockPrismaUser.update.mockRejectedValue(new Error('Database error'))

    const validUuid = '550e8400-e29b-41d4-a716-446655440000'

    // コンソールエラーをモック
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    await expect(deleteUserAccount(validUuid)).rejects.toThrow('アカウントの削除に失敗しました')

    expect(consoleSpy).toHaveBeenCalledWith('Account deletion failed:', expect.any(Error))

    consoleSpy.mockRestore()
  })
})
