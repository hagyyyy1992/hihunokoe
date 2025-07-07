'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
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
}

export default function PostModeration() {
  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [actionType, setActionType] = useState<'publish' | 'unpublish' | 'delete' | null>(null)

  const filterPosts = useCallback(() => {
    let filtered = posts

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
        setPosts(data)
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
    if (!selectedPost) return

    try {
      const response = await fetch(`/api/admin/posts/${selectedPost.id}/${action}`, {
        method: 'POST',
        credentials: 'include', // HTTPOnlyクッキーを送信
      })

      if (response.ok) {
        await fetchPosts()
        setSelectedPost(null)
        setActionType(null)
      }
    } catch (error) {
      console.error('投稿操作に失敗しました:', error)
    }
  }

  const getStatusBadge = (status: string) => {
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
        <CardContent>
          {/* 検索・フィルター */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="タイトル、内容、コスメ名、ユーザー名で検索"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

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

          {/* 投稿一覧テーブル */}
          <div className="border rounded-lg">
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
                {filteredPosts.map(post => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate" title={post.title}>
                        {post.title}
                      </div>
                    </TableCell>
                    <TableCell>{post.userName}</TableCell>
                    <TableCell>{post.cosmeticName}</TableCell>
                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                    <TableCell>{post.empathyCount}</TableCell>
                    <TableCell>{post.viewCount}</TableCell>
                    <TableCell>{new Date(post.createdAt).toLocaleDateString('ja-JP')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredPosts.length === 0 && (
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
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => actionType && handlePostAction(actionType)}
              className={actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {getActionLabel(actionType || '')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
