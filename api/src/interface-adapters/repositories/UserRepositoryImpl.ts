import { User, UserRole } from '@api/domain/entities/User'
import {
  UserRepository,
  CreateUserData,
  UpdateUserData,
  FindUsersFilter,
  FindUsersResult,
} from '@api/domain/repositories/UserRepository'
import { prisma } from '@/lib/prisma'
import { User as PrismaUser } from '@prisma/client'

export class UserRepositoryImpl implements UserRepository {
  async findById(id: string): Promise<User | null> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!prismaUser) return null
    return this.toDomainUser(prismaUser)
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaUser = await prisma.user.findUnique({
      where: { email },
    })

    if (!prismaUser) return null
    return this.toDomainUser(prismaUser)
  }

  async findByUsername(username: string): Promise<User | null> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaUser = await prisma.user.findUnique({
      where: { userName: username },
    })

    if (!prismaUser) return null
    return this.toDomainUser(prismaUser)
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaUser = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
    })

    if (!prismaUser) return null
    return this.toDomainUser(prismaUser)
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaUser = await prisma.user.findFirst({
      where: { passwordResetToken: token },
    })

    if (!prismaUser) return null
    return this.toDomainUser(prismaUser)
  }

  async create(user: CreateUserData): Promise<User> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaUser = await prisma.user.create({
      data: {
        userName: user.username,
        email: user.email,
        passwordHash: user.passwordHash,
        emailVerified: user.emailVerified,
        emailVerificationToken: user.emailVerificationToken,
        passwordResetToken: user.passwordResetToken,
        passwordResetExpiry: user.passwordResetExpires,
        isActive: user.active,
        role: user.role,
        deletedAt: user.deletedAt,
      },
    })

    return this.toDomainUser(prismaUser)
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const updateData: Record<string, unknown> = {}

    if (data.email !== undefined) updateData.email = data.email
    if (data.username !== undefined) updateData.userName = data.username
    if (data.passwordHash !== undefined) updateData.passwordHash = data.passwordHash
    if (data.emailVerified !== undefined) updateData.emailVerified = data.emailVerified
    if (data.emailVerificationToken !== undefined)
      updateData.emailVerificationToken = data.emailVerificationToken
    if (data.passwordResetToken !== undefined)
      updateData.passwordResetToken = data.passwordResetToken
    if (data.passwordResetExpires !== undefined)
      updateData.passwordResetExpiry = data.passwordResetExpires
    if (data.active !== undefined) updateData.isActive = data.active
    if (data.role !== undefined) updateData.role = data.role
    if (data.deletedAt !== undefined) updateData.deletedAt = data.deletedAt
    if (data.lockedUntil !== undefined) updateData.lockedUntil = data.lockedUntil
    if (data.failedLoginAttempts !== undefined)
      updateData.failedLoginAttempts = data.failedLoginAttempts

    if (!prisma) throw new Error('Database connection not available')

    const prismaUser = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    return this.toDomainUser(prismaUser)
  }

  async delete(id: string): Promise<void> {
    if (!prisma) throw new Error('Database connection not available')

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async incrementFailedLoginAttempts(id: string): Promise<void> {
    if (!prisma) throw new Error('Database connection not available')

    await prisma.$executeRaw`
      UPDATE users 
      SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1 
      WHERE id = ${id}::uuid
    `
  }

  async resetFailedLoginAttempts(id: string): Promise<void> {
    if (!prisma) throw new Error('Database connection not available')

    await prisma.$executeRaw`
      UPDATE users 
      SET failed_login_attempts = 0 
      WHERE id = ${id}::uuid
    `
  }

  async lockAccount(id: string, until: Date): Promise<void> {
    if (!prisma) throw new Error('Database connection not available')

    await prisma.$executeRaw`
      UPDATE users 
      SET locked_until = ${until} 
      WHERE id = ${id}::uuid
    `
  }

  async softDelete(id: string): Promise<void> {
    if (!prisma) throw new Error('Database connection not available')

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    if (!prisma) throw new Error('Database connection not available')

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    })
  }

  async verifyEmail(id: string): Promise<void> {
    if (!prisma) throw new Error('Database connection not available')

    await prisma.user.update({
      where: { id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
      },
    })
  }

  async findMany(filter: FindUsersFilter): Promise<FindUsersResult> {
    if (!prisma) throw new Error('Database connection not available')

    const where: any = {}

    // Active/inactive filter
    if (filter.activeOnly) {
      where.isActive = true
      where.deletedAt = null
    } else if (filter.inactiveOnly) {
      where.OR = [{ isActive: false }, { deletedAt: { not: null } }]
    }

    // Role filter
    if (filter.role) {
      where.role = filter.role
    }

    // Created after filter
    if (filter.createdAfter) {
      where.createdAt = { gte: filter.createdAfter }
    }

    // Search filter
    if (filter.search) {
      where.OR = [
        { userName: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
      ]
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: filter.offset,
        take: filter.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ])

    return {
      users: users.map(user => this.toDomainUser(user)),
      totalCount,
    }
  }

  // Admin-specific methods
  async findAllWithPostCount(): Promise<User[]> {
    if (!prisma) throw new Error('Database connection not available')

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    return users.map(user => this.toDomainUser(user))
  }

  async findRecentUsers(limit: number): Promise<User[]> {
    if (!prisma) throw new Error('Database connection not available')

    const users = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return users.map(user => this.toDomainUser(user))
  }

  async countActiveUsers(): Promise<number> {
    if (!prisma) throw new Error('Database connection not available')

    return await prisma.user.count({
      where: {
        isActive: true,
        deletedAt: null,
      },
    })
  }

  private toDomainUser(
    prismaUser: PrismaUser & { failedLoginAttempts?: number; lockedUntil?: Date | null }
  ): User {
    return new User(
      prismaUser.id,
      prismaUser.email,
      prismaUser.userName,
      prismaUser.userName, // userName alias
      prismaUser.passwordHash,
      null, // displayName (not in current schema)
      null, // profileImageUrl (not in current schema)
      prismaUser.birthDate,
      prismaUser.gender,
      prismaUser.skinType,
      prismaUser.skinTypeOther,
      prismaUser.allergies?.join(',') || null, // Convert array to string
      prismaUser.allergiesOther,
      prismaUser.emailVerified,
      prismaUser.emailVerificationToken,
      prismaUser.passwordResetToken,
      prismaUser.passwordResetExpiry,
      prismaUser.failedLoginAttempts || 0,
      prismaUser.lockedUntil || null,
      prismaUser.role as UserRole,
      prismaUser.isActive,
      prismaUser.isActive, // isActive alias
      prismaUser.deletedAt,
      prismaUser.createdAt,
      prismaUser.updatedAt,
      undefined // password field (not stored)
    )
  }
}
