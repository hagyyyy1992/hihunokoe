'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Mail, Calendar, Package, Heart, MessageSquare, MapPin, ExternalLink } from 'lucide-react'
import { getSkinTypeLabel, getSkinConditionLabel } from '@/lib/constants/profile'
import Link from 'next/link'

interface UserPreviewModalProps {
  user: {
    id: string
    userName: string
    email: string
    isActive: boolean
    role: string
    skinType?: string
    skinCondition?: string
    skinTone?: string
    personalColor?: string
    facialFeatures?: string
    allergies?: string
    createdAt: string
    postCount: number
    empathyCount?: number
    commentCount?: number
    location?: string
    bio?: string
  } | null
  isOpen: boolean
  onClose: () => void
}

export function UserPreviewModal({ user, isOpen, onClose }: UserPreviewModalProps) {
  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>ユーザープロフィール</DialogTitle>
            <Link href={`/profile?userId=${user.id}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                プロフィールを表示
              </Button>
            </Link>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* ユーザー基本情報 */}
          <div className="flex items-start gap-4">
            <Avatar name={user.userName} size="lg" className="h-16 w-16 text-xl" />

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold">{user.userName}</h3>
                <Badge
                  variant={
                    user.role === 'SUPER_ADMIN'
                      ? 'destructive'
                      : user.role === 'ADMIN'
                        ? 'default'
                        : 'secondary'
                  }
                >
                  {user.role === 'SUPER_ADMIN'
                    ? 'スーパー管理者'
                    : user.role === 'ADMIN'
                      ? '管理者'
                      : 'ユーザー'}
                </Badge>
                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                  {user.isActive ? 'アクティブ' : '停止中'}
                </Badge>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  登録日: {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                </div>
                {user.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {user.location}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 自己紹介 */}
          {user.bio && (
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium mb-2">自己紹介</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{user.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* 肌情報 */}
          <Card>
            <CardContent className="pt-4">
              <h4 className="font-medium mb-3">肌情報</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">肌タイプ:</span>
                  <span className="ml-2 font-medium">{getSkinTypeLabel(user.skinType)}</span>
                </div>
                <div>
                  <span className="text-gray-500">肌状態:</span>
                  <span className="ml-2 font-medium">
                    {getSkinConditionLabel(user.skinCondition)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">肌色:</span>
                  <span className="ml-2 font-medium">{user.skinTone || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">パーソナルカラー:</span>
                  <span className="ml-2 font-medium">{user.personalColor || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">顔の特徴:</span>
                  <span className="ml-2 font-medium">{user.facialFeatures || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">アレルギー:</span>
                  <span className="ml-2 font-medium">{user.allergies || 'なし'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 活動統計 */}
          <Card>
            <CardContent className="pt-4">
              <h4 className="font-medium mb-3">活動統計</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-2xl font-semibold">{user.postCount}</span>
                  </div>
                  <p className="text-xs text-gray-500">投稿数</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <Heart className="h-4 w-4 text-gray-500" />
                    <span className="text-2xl font-semibold">{user.empathyCount || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500">共感数</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="text-2xl font-semibold">{user.commentCount || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500">コメント数</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
