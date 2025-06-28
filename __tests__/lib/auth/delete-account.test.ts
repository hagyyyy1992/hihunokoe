import { deleteUserAccount } from '../../../src/lib/auth/auth'
import { isDatabaseAvailable } from '../../../src/lib/prisma'

// モック
const mockPrismaUser = {
  findUnique: jest.fn(),
  delete: jest.fn(),
}

jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    user: mockPrismaUser,
  },
  isDatabaseAvailable: jest.fn(),
}))

const mockIsDatabaseAvailable = isDatabaseAvailable as jest.MockedFunction<
  typeof isDatabaseAvailable
>

describe('deleteUserAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
    await expect(deleteUserAccount(validUuid)).rejects.toThrow('ユーザーが見つかりません')

    expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
      where: { id: validUuid, isActive: true },
    })
    expect(mockPrismaUser.delete).not.toHaveBeenCalled()
  })

  it('非アクティブなユーザーの場合はエラーを投げる', async () => {
    mockIsDatabaseAvailable.mockReturnValue(true)
    mockPrismaUser.findUnique.mockResolvedValue(null) // isActive: trueで検索するため見つからない

    const validUuid = '550e8400-e29b-41d4-a716-446655440000'
    await expect(deleteUserAccount(validUuid)).rejects.toThrow('ユーザーが見つかりません')
  })

  it('正常なユーザーIDでアカウント削除が成功する', async () => {
    mockIsDatabaseAvailable.mockReturnValue(true)

    const activeUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userName: 'testuser',
      email: 'test@example.com',
      isActive: true,
    }

    mockPrismaUser.findUnique.mockResolvedValue(activeUser)
    mockPrismaUser.delete.mockResolvedValue(activeUser)

    const validUuid = '550e8400-e29b-41d4-a716-446655440000'
    const result = await deleteUserAccount(validUuid)

    expect(result).toBe(true)
    expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
      where: { id: validUuid, isActive: true },
    })
    expect(mockPrismaUser.delete).toHaveBeenCalledWith({
      where: { id: validUuid },
    })
  })

  it('Prismaエラーが発生した場合は汎用エラーメッセージを投げる', async () => {
    mockIsDatabaseAvailable.mockReturnValue(true)

    const activeUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userName: 'testuser',
      email: 'test@example.com',
      isActive: true,
    }

    mockPrismaUser.findUnique.mockResolvedValue(activeUser)
    mockPrismaUser.delete.mockRejectedValue(new Error('Database error'))

    const validUuid = '550e8400-e29b-41d4-a716-446655440000'

    // コンソールエラーをモック
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    await expect(deleteUserAccount(validUuid)).rejects.toThrow('アカウントの削除に失敗しました')

    expect(consoleSpy).toHaveBeenCalledWith('Account deletion failed:', expect.any(Error))

    consoleSpy.mockRestore()
  })
})
