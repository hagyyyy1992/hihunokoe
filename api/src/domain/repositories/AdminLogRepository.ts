export interface AdminLogData {
  id: string
  adminUserId: string
  action: string
  target?: string | null
  targetType?: string | null
  details?: Record<string, any> | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: Date
}

export interface IAdminLogRepository {
  create(data: Omit<AdminLogData, 'id' | 'createdAt'>): Promise<AdminLogData>
  findByAdminUserId(adminUserId: string, limit?: number): Promise<AdminLogData[]>
  findByAction(action: string, limit?: number): Promise<AdminLogData[]>
}
