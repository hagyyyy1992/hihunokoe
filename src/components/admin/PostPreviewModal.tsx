'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Heart, Eye, MessageSquare, Calendar, Tag, Star } from 'lucide-react'

interface PostPreviewModalProps {
  post: {
    id: string
    title: string
    content: string
    userName: string
    status: string
    empathyCount: number
    viewCount: number
    commentCount?: number
    createdAt: string
    updatedAt?: string
    cosmeticName: string
    brandName?: string
    rating?: number
    tags?: string[]
    skinType?: string
    deletedAt?: string | null
  } | null
  isOpen: boolean
  onClose: () => void
}

export function PostPreviewModal({ post, isOpen, onClose }: PostPreviewModalProps) {
  if (!post) return null

  const getStatusBadge = (status: string, deletedAt?: string | null) => {
    if (deletedAt) {
      return <Badge variant="destructive">削除済み</Badge>
    }
    switch (status) {
      case 'published':
        return <Badge variant="default">公開</Badge>
      case 'draft':
        return <Badge variant="secondary">下書き</Badge>
      case 'hidden':
        return <Badge variant="destructive">非公開</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>投稿プレビュー</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 投稿者情報とステータス */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={post.userName} size="md" className="h-10 w-10" />
              <div>
                <p className="font-medium">{post.userName}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.createdAt).toLocaleDateString('ja-JP')}
                  </div>
                  {post.skinType && (
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{post.skinType}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(post.status, post.deletedAt)}
            </div>
          </div>

          {/* タイトル */}
          <h2 className="text-2xl font-bold">{post.title}</h2>

          {/* コスメ情報 */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{post.cosmeticName}</h3>
                  {post.brandName && <p className="text-sm text-gray-600">{post.brandName}</p>}
                </div>
                {post.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{post.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* タグ */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 本文 */}
          <Card>
            <CardContent className="pt-4">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-gray-700">{post.content}</p>
              </div>
            </CardContent>
          </Card>

          {/* 統計情報 */}
          <Card>
            <CardContent className="pt-4">
              <h4 className="font-medium mb-3">エンゲージメント統計</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <Eye className="h-4 w-4 text-gray-500" />
                    <span className="text-2xl font-semibold">{post.viewCount}</span>
                  </div>
                  <p className="text-xs text-gray-500">ビュー数</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <Heart className="h-4 w-4 text-gray-500" />
                    <span className="text-2xl font-semibold">{post.empathyCount}</span>
                  </div>
                  <p className="text-xs text-gray-500">共感数</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="text-2xl font-semibold">{post.commentCount || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500">コメント数</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* メタ情報 */}
          <div className="text-sm text-gray-500 space-y-1">
            <p>投稿ID: {post.id}</p>
            <p>作成日時: {new Date(post.createdAt).toLocaleString('ja-JP')}</p>
            {post.updatedAt && post.updatedAt !== post.createdAt && (
              <p>更新日時: {new Date(post.updatedAt).toLocaleString('ja-JP')}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
