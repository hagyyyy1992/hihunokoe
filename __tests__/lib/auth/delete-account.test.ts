import { deleteUserAccount } from '../../../src/lib/auth/auth'
import { prisma, isDatabaseAvailable } from '../../../src/lib/prisma'

// モック
jest.mock('../../../src/lib/prisma')

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

    const mockPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        delete: jest.fn(),
      },
    }
    ;(prisma as any) = mockPrisma

    const validUuid = '550e8400-e29b-41d4-a716-446655440000'
    await expect(deleteUserAccount(validUuid)).rejects.toThrow('ユーザーが見つかりません')

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: validUuid, isActive: true },
    })
    expect(mockPrisma.user.delete).not.toHaveBeenCalled()
  })

  it('非アクティブなユーザーの場合はエラーを投げる', async () => {
    mockIsDatabaseAvailable.mockReturnValue(true)

    const inactiveUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userName: 'testuser',
      email: 'test@example.com',
      isActive: false,
    }

    const mockPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null), // isActive: trueで検索するため見つからない
        delete: jest.fn(),
      },
    }
    ;(prisma as any) = mockPrisma

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

    const mockPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(activeUser),
        delete: jest.fn().mockResolvedValue(activeUser),
      },
    }
    ;(prisma as any) = mockPrisma

    const validUuid = '550e8400-e29b-41d4-a716-446655440000'
    const result = await deleteUserAccount(validUuid)

    expect(result).toBe(true)
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: validUuid, isActive: true },
    })
    expect(mockPrisma.user.delete).toHaveBeenCalledWith({
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

    const mockPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(activeUser),
        delete: jest.fn().mockRejectedValue(new Error('Database error')),
      },
    }
    ;(prisma as any) = mockPrisma

    const validUuid = '550e8400-e29b-41d4-a716-446655440000'

    // コンソールエラーをモック
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    await expect(deleteUserAccount(validUuid)).rejects.toThrow('アカウントの削除に失敗しました')

    expect(consoleSpy).toHaveBeenCalledWith('Account deletion failed:', expect.any(Error))

    consoleSpy.mockRestore()
  })
})
