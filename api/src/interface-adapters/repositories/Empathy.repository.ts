import { Empathy } from '@api/domain/entities/Empathy'
import { IEmpathyRepository, CreateEmpathyData } from '@api/domain/repositories/EmpathyRepository'
import { prisma } from '@/lib/prisma'
import { Empathy as PrismaEmpathy } from '@prisma/client'

export class EmpathyRepository implements IEmpathyRepository {
  async findById(id: string): Promise<Empathy | null> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaEmpathy = await prisma.empathy.findUnique({
      where: { id },
    })

    if (!prismaEmpathy) return null
    return this.toDomainEmpathy(prismaEmpathy)
  }

  async findByUserAndPost(userId: string, postId: string): Promise<Empathy | null> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaEmpathy = await prisma.empathy.findFirst({
      where: {
        userId,
        postId,
      },
    })

    if (!prismaEmpathy) return null
    return this.toDomainEmpathy(prismaEmpathy)
  }

  async findByUserAndPosts(userId: string, postIds: string[]): Promise<Empathy[]> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaEmpathies = await prisma.empathy.findMany({
      where: {
        userId,
        postId: {
          in: postIds,
        },
      },
    })

    return prismaEmpathies.map(empathy => this.toDomainEmpathy(empathy))
  }

  async findByPost(postId: string): Promise<Empathy[]> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaEmpathies = await prisma.empathy.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
    })

    return prismaEmpathies.map(empathy => this.toDomainEmpathy(empathy))
  }

  async findByUser(userId: string): Promise<Empathy[]> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaEmpathies = await prisma.empathy.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return prismaEmpathies.map(empathy => this.toDomainEmpathy(empathy))
  }

  async create(data: CreateEmpathyData): Promise<Empathy> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaEmpathy = await prisma.empathy.create({
      data: {
        userId: data.userId,
        postId: data.postId,
        empathyType: data.empathyType,
      },
    })

    return this.toDomainEmpathy(prismaEmpathy)
  }

  async delete(id: string): Promise<void> {
    if (!prisma) throw new Error('Database connection not available')

    await prisma.empathy.delete({
      where: { id },
    })
  }

  async countByPost(postId: string): Promise<number> {
    if (!prisma) throw new Error('Database connection not available')

    return await prisma.empathy.count({
      where: { postId },
    })
  }

  async countByUser(userId: string): Promise<number> {
    if (!prisma) throw new Error('Database connection not available')

    return await prisma.empathy.count({
      where: { userId },
    })
  }

  async countTotal(): Promise<number> {
    if (!prisma) throw new Error('Database connection not available')

    return await prisma.empathy.count()
  }

  private toDomainEmpathy(prismaEmpathy: PrismaEmpathy): Empathy {
    return new Empathy(
      prismaEmpathy.id,
      prismaEmpathy.userId,
      prismaEmpathy.postId,
      prismaEmpathy.empathyType as any, // Type cast needed due to Prisma enum vs domain type
      prismaEmpathy.createdAt
    )
  }
}
