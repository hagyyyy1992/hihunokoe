import { PrismaClient } from '@prisma/client'
import { AdminUserRepository } from '@api/domain/repositories/AdminUserRepository'
import { AdminUser } from '@api/domain/entities/AdminUser'

export class AdminUserRepositoryImpl implements AdminUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<AdminUser | null> {
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { id },
    })
    return adminUser ? this.mapToEntity(adminUser) : null
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { email },
    })
    return adminUser ? this.mapToEntity(adminUser) : null
  }

  async findByAdminName(adminName: string): Promise<AdminUser | null> {
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { adminName },
    })
    return adminUser ? this.mapToEntity(adminUser) : null
  }

  async findAll(): Promise<AdminUser[]> {
    const adminUsers = await this.prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return adminUsers.map(this.mapToEntity)
  }

  async create(data: {
    adminName: string
    email: string
    passwordHash: string
    role: 'ADMIN' | 'SUPER_ADMIN'
    isActive?: boolean
    createdBy?: string
  }): Promise<AdminUser> {
    const adminUser = await this.prisma.adminUser.create({
      data: {
        adminName: data.adminName,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        isActive: data.isActive ?? true,
        createdBy: data.createdBy,
      },
    })
    return this.mapToEntity(adminUser)
  }

  async update(
    id: string,
    data: {
      adminName?: string
      email?: string
      passwordHash?: string
      role?: 'ADMIN' | 'SUPER_ADMIN'
      isActive?: boolean
      lastLoginAt?: Date
      failedLoginAttempts?: number
      lockedUntil?: Date | null
      permissions?: any
    }
  ): Promise<AdminUser> {
    const adminUser = await this.prisma.adminUser.update({
      where: { id },
      data,
    })
    return this.mapToEntity(adminUser)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.adminUser.delete({
      where: { id },
    })
  }

  async incrementLoginCount(id: string): Promise<void> {
    await this.prisma.adminUser.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    })
  }

  async incrementFailedLoginAttempts(id: string): Promise<void> {
    await this.prisma.adminUser.update({
      where: { id },
      data: {
        failedLoginAttempts: { increment: 1 },
      },
    })
  }

  async resetFailedLoginAttempts(id: string): Promise<void> {
    await this.prisma.adminUser.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
      },
    })
  }

  async lockAccount(id: string, until: Date): Promise<void> {
    await this.prisma.adminUser.update({
      where: { id },
      data: {
        lockedUntil: until,
      },
    })
  }

  async unlockAccount(id: string): Promise<void> {
    await this.prisma.adminUser.update({
      where: { id },
      data: {
        lockedUntil: null,
        failedLoginAttempts: 0,
      },
    })
  }

  private mapToEntity(prismaAdminUser: any): AdminUser {
    return {
      id: prismaAdminUser.id,
      adminName: prismaAdminUser.adminName,
      email: prismaAdminUser.email,
      passwordHash: prismaAdminUser.passwordHash,
      role: prismaAdminUser.role,
      isActive: prismaAdminUser.isActive,
      lastLoginAt: prismaAdminUser.lastLoginAt,
      failedLoginAttempts: prismaAdminUser.failedLoginAttempts,
      lockedUntil: prismaAdminUser.lockedUntil,
      permissions: prismaAdminUser.permissions,
      createdAt: prismaAdminUser.createdAt,
      updatedAt: prismaAdminUser.updatedAt,
      createdBy: prismaAdminUser.createdBy,
    }
  }
}
