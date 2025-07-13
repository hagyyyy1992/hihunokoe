import { User } from '@api/domain/entities/User'
import {
  AdminLoginOutputPort,
  ActivateUserOutputPort,
  SuspendUserOutputPort,
  AdminDeletePostOutputPort,
  PublishPostOutputPort,
  UnpublishPostOutputPort,
  GetAdminUsersOutputPort,
  GetAdminPostsOutputPort,
  GetDashboardStatsOutputPort,
  ExportUsersOutputPort,
} from './output-port'

// Admin Authentication
export abstract class IAdminAuthenticationInputPort {
  abstract adminLogin(inputPort: AdminLoginInputPort): Promise<AdminLoginOutputPort>
  abstract adminLogout(inputPort: AdminLogoutInputPort): Promise<void>
  abstract getCurrentAdmin(inputPort: GetCurrentAdminInputPort): Promise<{ user: User }>
}

export type AdminLoginInputPort = {
  email: string
  password: string
  ipAddress?: string
  userAgent?: string
}

export type AdminLogoutInputPort = {
  adminUserId: string
}

export type GetCurrentAdminInputPort = {
  adminUserId: string
}

// Admin User Management
export abstract class IAdminUserManagementInputPort {
  abstract activateUser(inputPort: ActivateUserInputPort): Promise<ActivateUserOutputPort>
  abstract suspendUser(inputPort: SuspendUserInputPort): Promise<SuspendUserOutputPort>
  abstract getAdminUsers(inputPort: GetAdminUsersInputPort): Promise<GetAdminUsersOutputPort>
  abstract exportUsers(inputPort: ExportUsersInputPort): Promise<ExportUsersOutputPort>
}

export type ActivateUserInputPort = {
  adminUserId: string
  targetUserId: string
  ipAddress?: string
  userAgent?: string
}

export type SuspendUserInputPort = {
  adminUserId: string
  targetUserId: string
  reason?: string
  ipAddress?: string
  userAgent?: string
}

export type GetAdminUsersInputPort = {
  adminUserId: string
  page?: number
  limit?: number
  search?: string
  status?: 'active' | 'suspended' | 'deleted' | 'all'
  role?: string
}

export type ExportUsersInputPort = {
  adminUserId: string
  format: 'csv' | 'json'
  filters?: {
    status?: 'active' | 'suspended' | 'deleted'
    dateRange?: {
      start: Date
      end: Date
    }
  }
}

// Admin Post Management
export abstract class IAdminPostManagementInputPort {
  abstract deletePost(inputPort: AdminDeletePostInputPort): Promise<AdminDeletePostOutputPort>
  abstract publishPost(inputPort: PublishPostInputPort): Promise<PublishPostOutputPort>
  abstract unpublishPost(inputPort: UnpublishPostInputPort): Promise<UnpublishPostOutputPort>
  abstract getAdminPosts(inputPort: GetAdminPostsInputPort): Promise<GetAdminPostsOutputPort>
}

export type AdminDeletePostInputPort = {
  adminUserId: string
  postId: string
  reason?: string
  ipAddress?: string
  userAgent?: string
}

export type PublishPostInputPort = {
  adminUserId: string
  postId: string
  ipAddress?: string
  userAgent?: string
}

export type UnpublishPostInputPort = {
  adminUserId: string
  postId: string
  reason?: string
  ipAddress?: string
  userAgent?: string
}

export type GetAdminPostsInputPort = {
  adminUserId: string
  page?: number
  limit?: number
  search?: string
  status?: 'published' | 'unpublished' | 'deleted' | 'all'
}

// Admin Dashboard
export abstract class IAdminDashboardInputPort {
  abstract getDashboardStats(
    inputPort: GetDashboardStatsInputPort
  ): Promise<GetDashboardStatsOutputPort>
}

export type GetDashboardStatsInputPort = {
  adminUserId: string
  dateRange?: {
    start: Date
    end: Date
  }
}
