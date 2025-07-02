import { User, UserRole } from '@api/domain/entities/User'
import { UserRepository, CreateUserData, UpdateUserData } from '@api/domain/repositories/UserRepository'
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

  private toDomainUser(
    prismaUser: PrismaUser & { failedLoginAttempts?: number; lockedUntil?: Date | null }
  ): User {
    return new User(
      prismaUser.id,
      prismaUser.email,
      prismaUser.userName,
      prismaUser.passwordHash,
      prismaUser.emailVerified,
      prismaUser.emailVerificationToken,
      prismaUser.passwordResetToken,
      prismaUser.passwordResetExpiry,
      prismaUser.failedLoginAttempts || 0,
      prismaUser.lockedUntil || null,
      prismaUser.role as UserRole,
      prismaUser.isActive,
      prismaUser.deletedAt,
      prismaUser.createdAt,
      prismaUser.updatedAt
    )
  }
}
