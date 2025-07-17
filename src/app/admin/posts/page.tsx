'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SimpleSelect } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Search, Eye, EyeOff, Trash2, Check } from 'lucide-react'
import { PostPreviewModal } from '@/components/admin/PostPreviewModal'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Post {
  id: string
  title: string
  content: string
  userName: string
  status: string
  empathyCount: number
  viewCount: number
  createdAt: string
  cosmeticName: string
  deletedAt?: string | null
}

export default function PostModeration() {
  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [actionType, setActionType] = useState<'publish' | 'unpublish' | 'delete' | null>(null)
  const [previewPost, setPreviewPost] = useState<Post | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const filterPosts = useCallback(() => {
    let filtered = Array.isArray(posts) ? posts : []

    if (searchTerm) {
      filtered = filtered.filter(
        post =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.cosmeticName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.userName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(post => post.status === statusFilter)
    }

    setFilteredPosts(filtered)
  }, [posts, searchTerm, statusFilter])

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/admin/posts', {
        credentials: 'include', // HTTPOnlyクッキーを送信
      })

      if (response.ok) {
        const data = await response.json()
        setPosts(data.success && data.data ? data.data.posts || [] : data.posts || data)
      }
    } catch (error) {
      console.error('投稿一覧の取得に失敗しました:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    filterPosts()
  }, [filterPosts])

  const handlePostAction = async (action: 'publish' | 'unpublish' | 'delete') => {
    if (!selectedPost || isActionLoading) return

    setIsActionLoading(true)
    try {
      const response = await fetch(`/api/admin/posts/${selectedPost.id}/${action}`, {
        method: 'POST',
        credentials: 'include', // HTTPOnlyクッキーを送信
      })

      // 一時的な対処: 500エラーでもデータが更新される可能性があるため
      // レスポンスに関わらずデータを再取得
      if (response.ok || response.status === 500) {
        await fetchPosts()
        setSelectedPost(null)
        setActionType(null)
      }
    } catch (error) {
      console.error('投稿操作に失敗しました:', error)
      // エラーが発生してもデータ再取得を試みる
      await fetchPosts()
      setSelectedPost(null)
      setActionType(null)
    } finally {
      setIsActionLoading(false)
    }
  }

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

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'publish':
        return '公開する'
      case 'unpublish':
        return '非公開にする'
      case 'delete':
        return '削除する'
      default:
        return action
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>投稿管理</CardTitle>
          <CardDescription>投稿の一覧表示、検索、管理を行います</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-8">
          {/* 検索・フィルター */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="タイトル、内容、コスメ名、ユーザー名で検索"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <SimpleSelect
                value={statusFilter}
                onValueChange={setStatusFilter}
                className="w-full sm:w-40"
              >
                <option value="all">すべて</option>
                <option value="published">公開</option>
                <option value="draft">下書き</option>
                <option value="hidden">非公開</option>
              </SimpleSelect>
            </div>
          </div>

          {/* 投稿一覧 - モバイル用カード表示 */}
          <div className="block lg:hidden space-y-3">
            {Array.isArray(filteredPosts) &&
              filteredPosts.map(post => (
                <Card key={post.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 mr-2">
                        <h3 className="font-semibold text-sm line-clamp-2" title={post.title}>
                          {post.title}
                        </h3>
                        <p className="text-xs text-gray-600 truncate">{post.userName}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(post.status, post.deletedAt)}
                      </div>
                    </div>

                    <div className="space-y-1 mb-3 text-xs">
                      <div className="flex">
                        <span className="text-gray-500 w-14">コスメ:</span>
                        <span className="truncate">{post.cosmeticName}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-14">投稿日:</span>
                        <span>{new Date(post.createdAt).toLocaleDateString('ja-JP')}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-14">共感:</span>
                        <span>
                          {post.empathyCount} / ビュー: {post.viewCount}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => {
                                setPreviewPost(post)
                                setIsPreviewOpen(true)
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>投稿をプレビュー</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {!post.deletedAt && (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {post.status === 'published' ? (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 px-2 flex-1 text-xs"
                                    onClick={() => {
                                      setSelectedPost(post)
                                      setActionType('unpublish')
                                    }}
                                  >
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    非公開
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="h-7 px-2 flex-1 text-xs"
                                    onClick={() => {
                                      setSelectedPost(post)
                                      setActionType('publish')
                                    }}
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    公開
                                  </Button>
                                )}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {post.status === 'published'
                                    ? '投稿を非公開にする'
                                    : '投稿を公開する'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => {
                                    setSelectedPost(post)
                                    setActionType('delete')
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>投稿を削除</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      )}
                      {post.deletedAt && (
                        <div className="flex-1 text-xs text-gray-500 text-center">
                          ユーザーが削除済み
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* 投稿一覧テーブル - デスクトップ表示 */}
          <div className="hidden lg:block border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>タイトル</TableHead>
                  <TableHead>ユーザー</TableHead>
                  <TableHead>コスメ名</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>共感数</TableHead>
                  <TableHead>ビュー数</TableHead>
                  <TableHead>投稿日</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(filteredPosts) &&
                  filteredPosts.map(post => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium max-w-xs">
                        <div className="truncate" title={post.title}>
                          {post.title}
                        </div>
                      </TableCell>
                      <TableCell>{post.userName}</TableCell>
                      <TableCell>{post.cosmeticName}</TableCell>
                      <TableCell>{getStatusBadge(post.status, post.deletedAt)}</TableCell>
                      <TableCell>{post.empathyCount}</TableCell>
                      <TableCell>{post.viewCount}</TableCell>
                      <TableCell>{new Date(post.createdAt).toLocaleDateString('ja-JP')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setPreviewPost(post)
                                    setIsPreviewOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>投稿をプレビュー</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {!post.deletedAt ? (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    {post.status === 'published' ? (
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => {
                                          setSelectedPost(post)
                                          setActionType('unpublish')
                                        }}
                                      >
                                        <EyeOff className="h-4 w-4" />
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => {
                                          setSelectedPost(post)
                                          setActionType('publish')
                                        }}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {post.status === 'published' ? '非公開にする' : '公開する'}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        setSelectedPost(post)
                                        setActionType('delete')
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>投稿を削除</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">ユーザー削除済み</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {Array.isArray(filteredPosts) && filteredPosts.length === 0 && (
            <div className="text-center py-8 text-gray-500">該当する投稿が見つかりませんでした</div>
          )}
        </CardContent>
      </Card>

      {/* 確認ダイアログ */}
      <AlertDialog
        open={!!actionType}
        onOpenChange={() => {
          setActionType(null)
          setSelectedPost(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>投稿を{getActionLabel(actionType || '')}</AlertDialogTitle>
            <AlertDialogDescription>
              「{selectedPost?.title}」を{getActionLabel(actionType || '')}しますか？
              {actionType === 'delete' && '削除された投稿は復元できません。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setActionType(null)
                setSelectedPost(null)
              }}
              disabled={isActionLoading}
            >
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => actionType && handlePostAction(actionType)}
              className={actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  処理中...
                </div>
              ) : (
                getActionLabel(actionType || '')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 投稿プレビューモーダル */}
      <PostPreviewModal
        post={previewPost}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false)
          setPreviewPost(null)
        }}
      />
    </div>
  )
}
