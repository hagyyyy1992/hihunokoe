import { AdminLogRepositoryImpl } from '@api/interface-adapters/repositories/AdminLogRepositoryImpl'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

// Prismaクライアントのモック
const mockPrisma = {
  adminLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
}

describe('AdminLogRepositoryImpl', () => {
  let repository: AdminLogRepositoryImpl

  beforeEach(() => {
    repository = new AdminLogRepositoryImpl(mockPrisma as any)
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('管理者ログを作成できる', async () => {
      const logData = {
        adminUserId: uuidv4(),
        action: 'USER_SUSPEND',
        target: uuidv4(),
        targetType: 'user',
        details: { reason: 'Violation of terms' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      }

      const createdLog = {
        id: uuidv4(),
        ...logData,
        createdAt: new Date(),
      }

      mockPrisma.adminLog.create.mockResolvedValue(createdLog)

      const result = await repository.create(logData)

      expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
        data: {
          adminUserId: logData.adminUserId,
          action: logData.action,
          target: logData.target,
          targetType: logData.targetType,
          details: logData.details,
          ipAddress: logData.ipAddress,
          userAgent: logData.userAgent,
        },
      })
      expect(result).toEqual(createdLog)
    })

    it('詳細情報なしでもログを作成できる', async () => {
      const logData = {
        adminUserId: uuidv4(),
        action: 'USER_LOGIN',
        target: '',
        targetType: 'auth',
        details: null,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      }

      const createdLog = {
        id: uuidv4(),
        ...logData,
        createdAt: new Date(),
      }

      mockPrisma.adminLog.create.mockResolvedValue(createdLog)

      const result = await repository.create(logData)

      expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
        data: {
          adminUserId: logData.adminUserId,
          action: logData.action,
          target: logData.target,
          targetType: logData.targetType,
          details: undefined,
          ipAddress: logData.ipAddress,
          userAgent: logData.userAgent,
        },
      })
      expect(result).toEqual(createdLog)
    })
  })

  describe('findByAdminUserId', () => {
    it('管理者IDでログを検索できる', async () => {
      const adminUserId = uuidv4()
      const logs = [
        {
          id: uuidv4(),
          adminUserId,
          action: 'USER_SUSPEND',
          target: uuidv4(),
          targetType: 'user',
          details: {},
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date(),
        },
        {
          id: uuidv4(),
          adminUserId,
          action: 'POST_DELETE',
          target: uuidv4(),
          targetType: 'post',
          details: {},
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date(),
        },
      ]

      mockPrisma.adminLog.findMany.mockResolvedValue(logs)

      const result = await repository.findByAdminUserId(adminUserId)

      expect(mockPrisma.adminLog.findMany).toHaveBeenCalledWith({
        where: { adminUserId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
      expect(result).toEqual(logs)
    })

    it('カスタムリミットで検索できる', async () => {
      const adminUserId = uuidv4()
      mockPrisma.adminLog.findMany.mockResolvedValue([])

      await repository.findByAdminUserId(adminUserId, 50)

      expect(mockPrisma.adminLog.findMany).toHaveBeenCalledWith({
        where: { adminUserId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    })
  })

  describe('findByAction', () => {
    it('アクションタイプでログを検索できる', async () => {
      const action = 'USER_SUSPEND'
      const logs = [
        {
          id: uuidv4(),
          adminUserId: uuidv4(),
          action,
          target: uuidv4(),
          targetType: 'user',
          details: {},
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date(),
        },
      ]

      mockPrisma.adminLog.findMany.mockResolvedValue(logs)

      const result = await repository.findByAction(action)

      expect(mockPrisma.adminLog.findMany).toHaveBeenCalledWith({
        where: { action },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
      expect(result).toEqual(logs)
    })

    it('カスタムリミットで検索できる', async () => {
      const action = 'POST_DELETE'
      mockPrisma.adminLog.findMany.mockResolvedValue([])

      await repository.findByAction(action, 20)

      expect(mockPrisma.adminLog.findMany).toHaveBeenCalledWith({
        where: { action },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    })
  })

  describe('エラーハンドリング', () => {
    it('データベースエラーを適切に伝播する', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.adminLog.create.mockRejectedValue(dbError)

      const logData = {
        adminUserId: uuidv4(),
        action: 'USER_SUSPEND',
        target: uuidv4(),
        targetType: 'user',
        details: {},
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      }

      await expect(repository.create(logData)).rejects.toThrow('Database connection failed')
    })
  })

  describe('データ変換', () => {
    it('Prismaのデータを正しくAdminLogDataに変換する', async () => {
      const prismaLog = {
        id: uuidv4(),
        adminUserId: uuidv4(),
        action: 'USER_UPDATE',
        target: uuidv4(),
        targetType: 'user',
        details: { updatedFields: ['email', 'name'] },
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/120.0',
        createdAt: new Date(),
        // Prismaが返す可能性のある追加フィールド
        updatedAt: new Date(),
      }

      mockPrisma.adminLog.findMany.mockResolvedValue([prismaLog])

      const result = await repository.findByAction('USER_UPDATE')

      expect(result[0]).toEqual({
        id: prismaLog.id,
        adminUserId: prismaLog.adminUserId,
        action: prismaLog.action,
        target: prismaLog.target,
        targetType: prismaLog.targetType,
        details: prismaLog.details,
        ipAddress: prismaLog.ipAddress,
        userAgent: prismaLog.userAgent,
        createdAt: prismaLog.createdAt,
      })
      // updatedAtは含まれないことを確認
      expect(result[0]).not.toHaveProperty('updatedAt')
    })

    it('詳細情報がnullの場合も正しく処理する', async () => {
      const prismaLog = {
        id: uuidv4(),
        adminUserId: uuidv4(),
        action: 'USER_LOGIN',
        target: '',
        targetType: 'auth',
        details: null,
        ipAddress: '192.168.1.1',
        userAgent: 'Safari/17.0',
        createdAt: new Date(),
      }

      mockPrisma.adminLog.findMany.mockResolvedValue([prismaLog])

      const result = await repository.findByAdminUserId(prismaLog.adminUserId)

      expect(result[0].details).toBeNull()
    })
  })
})
