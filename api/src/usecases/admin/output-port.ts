import { User } from '@api/domain/entities/User'
import { Post } from '@api/domain/entities/Post'

// Admin Authentication
export type AdminLoginOutputPort = {
  token: string
  user: User
}

// Admin User Management
export type ActivateUserOutputPort = {
  user: User
  message: string
}

export type SuspendUserOutputPort = {
  user: User
  message: string
}

export type GetAdminUsersOutputPort = {
  users: User[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}

export type ExportUsersOutputPort = {
  data: string | object[]
  filename: string
  contentType: string
}

// Admin Post Management
export type AdminDeletePostOutputPort = {
  postId: string
  message: string
}

export type PublishPostOutputPort = {
  post: Post
  message: string
}

export type UnpublishPostOutputPort = {
  post: Post
  message: string
}

export type GetAdminPostsOutputPort = {
  posts: Post[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}

// Admin Dashboard
export type GetDashboardStatsOutputPort = {
  stats: {
    totalUsers: number
    activeUsers: number
    suspendedUsers: number
    totalPosts: number
    publishedPosts: number
    unpublishedPosts: number
    totalComments: number
    todayRegistrations: number
    todayPosts: number
    todayComments: number
  }
  userGrowth: Array<{
    date: string
    count: number
  }>
  postGrowth: Array<{
    date: string
    count: number
  }>
  recentUsers?: Array<{
    id: string
    userName: string
    email: string
    createdAt: Date
  }>
  recentPosts?: Array<{
    id: string
    title: string
    userName: string
    empathyCount: number
    createdAt: Date
  }>
}
