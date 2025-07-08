import { PrismaClient } from '@prisma/client'
import { AdminLogRepository, AdminLogData } from '@api/domain/repositories/AdminLogRepository'

export class AdminLogRepositoryImpl implements AdminLogRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<AdminLogData, 'id' | 'createdAt'>): Promise<AdminLogData> {
    const adminLog = await this.prisma.adminLog.create({
      data: {
        adminUserId: data.adminUserId,
        action: data.action,
        target: data.target,
        targetType: data.targetType,
        details: data.details || undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })

    return this.toAdminLogData(adminLog)
  }

  async findByAdminUserId(adminUserId: string, limit = 100): Promise<AdminLogData[]> {
    const logs = await this.prisma.adminLog.findMany({
      where: { adminUserId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return logs.map(this.toAdminLogData)
  }

  async findByAction(action: string, limit = 100): Promise<AdminLogData[]> {
    const logs = await this.prisma.adminLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return logs.map(this.toAdminLogData)
  }

  private toAdminLogData(adminLog: any): AdminLogData {
    return {
      id: adminLog.id,
      adminUserId: adminLog.adminUserId,
      action: adminLog.action,
      target: adminLog.target,
      targetType: adminLog.targetType,
      details: adminLog.details as Record<string, any> | null,
      ipAddress: adminLog.ipAddress,
      userAgent: adminLog.userAgent,
      createdAt: adminLog.createdAt,
    }
  }
}

